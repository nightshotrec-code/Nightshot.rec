# ------------------------------------------------------------
# NIGHTSHOT — recursive video optimizer
#
# Структура:
# project-root/
#   optimize-videos.ps1
#   assets/
#     media-video/
#       subfolder-1/
#       subfolder-2/
# ------------------------------------------------------------

$ErrorActionPreference = "Stop"

# Папка з відео відносно цього скрипта
$VideoRoot = Join-Path $PSScriptRoot "assets\media\video"

# Формати, які оброблятимуться
$SupportedExtensions = @(
    ".mp4",
    ".m4v",
    ".mov",
    ".webm"
)

# Максимальні параметри для сайту
$MaxWidth = 1920
$MaxHeight = 1080
$MaxFps = 30

# ------------------------------------------------------------
# Перевірки
# ------------------------------------------------------------

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    throw "FFmpeg не знайдений. Перевір командою: ffmpeg -version"
}

if (-not (Get-Command ffprobe -ErrorAction SilentlyContinue)) {
    throw "FFprobe не знайдений. Він має встановлюватися разом із FFmpeg."
}

if (-not (Test-Path -LiteralPath $VideoRoot)) {
    throw "Папку не знайдено: $VideoRoot"
}

Write-Host ""
Write-Host "Video folder: $VideoRoot" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------
# Пошук усіх відео в підпапках
# ------------------------------------------------------------

$VideoFiles = Get-ChildItem `
    -LiteralPath $VideoRoot `
    -Recurse `
    -File |
Where-Object {
    $_.Extension.ToLowerInvariant() -in $SupportedExtensions -and
    $_.BaseName -notmatch "_old$" -and
    $_.BaseName -notmatch "\.__converting__$"
}

if ($VideoFiles.Count -eq 0) {
    Write-Host "Відеофайлів для конвертації не знайдено." -ForegroundColor Yellow
    exit 0
}

Write-Host "Знайдено відео: $($VideoFiles.Count)" -ForegroundColor Green
Write-Host ""

# ------------------------------------------------------------
# Конвертація
# ------------------------------------------------------------

foreach ($File in $VideoFiles) {

    $Extension = $File.Extension.ToLowerInvariant()
    $OriginalSize = $File.Length

    $OldFileName = "$($File.BaseName)_old$($File.Extension)"
    $OldPath = Join-Path $File.DirectoryName $OldFileName

    $TemporaryFileName = "$($File.BaseName).__converting__$($File.Extension)"
    $TemporaryPath = Join-Path $File.DirectoryName $TemporaryFileName

    Write-Host "------------------------------------------------------------"
    Write-Host "Файл: $($File.FullName)" -ForegroundColor Cyan

    # Якщо backup уже існує, файл не обробляємо повторно
    if (Test-Path -LiteralPath $OldPath) {
        Write-Host "Пропущено: backup уже існує — $OldFileName" -ForegroundColor Yellow
        continue
    }

    # Видаляємо незавершений тимчасовий файл від попереднього запуску
    if (Test-Path -LiteralPath $TemporaryPath) {
        Remove-Item -LiteralPath $TemporaryPath -Force
    }

    # Отримуємо FPS оригінального відео
    $FrameRateRaw = & ffprobe `
        -v error `
        -select_streams "v:0" `
        -show_entries "stream=avg_frame_rate" `
        -of "default=noprint_wrappers=1:nokey=1" `
        $File.FullName

    $CurrentFps = 0

    if ($FrameRateRaw -match "^(\d+)\/(\d+)$") {
        $Numerator = [double]$Matches[1]
        $Denominator = [double]$Matches[2]

        if ($Denominator -ne 0) {
            $CurrentFps = $Numerator / $Denominator
        }
    }

    # Не збільшуємо маленькі відео.
    # Відео більше 1920×1080 зменшуються зі збереженням пропорцій.
    $Filters = @()

    if ($CurrentFps -gt $MaxFps) {
        $Filters += "fps=$MaxFps"
    }

    $Filters += "scale='min($MaxWidth,iw)':'min($MaxHeight,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2"
    $Filters += "setsar=1"

    $VideoFilter = $Filters -join ","

    $FfmpegArguments = @(
        "-y"
        "-hide_banner"
        "-loglevel", "error"

        "-i", $File.FullName

        # Використовуємо тільки перший відеопотік
        "-map", "0:v:0"

        # Для фонових відео сайту аудіо не потрібне
        "-an"

        # Прибираємо метадані та chapters
        "-map_metadata", "-1"
        "-map_chapters", "-1"

        "-vf", $VideoFilter
    )

    if ($Extension -eq ".webm") {

        # WebM → VP9
        $FfmpegArguments += @(
            "-c:v", "libvpx-vp9"
            "-crf", "32"
            "-b:v", "0"
            "-deadline", "good"
            "-cpu-used", "2"
            "-row-mt", "1"

            # Зберігає можливість прозорості WebM
            "-pix_fmt", "yuva420p"
        )

    } else {

        # MP4 / MOV / M4V → H.264
        $FfmpegArguments += @(
            "-c:v", "libx264"
            "-preset", "slow"
            "-crf", "24"
            "-pix_fmt", "yuv420p"
            "-movflags", "+faststart"
        )
    }

    $FfmpegArguments += $TemporaryPath

    & ffmpeg @FfmpegArguments

    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $TemporaryPath)) {

        Write-Host "Помилка конвертації. Оригінал не змінено." -ForegroundColor Red

        if (Test-Path -LiteralPath $TemporaryPath) {
            Remove-Item -LiteralPath $TemporaryPath -Force
        }

        continue
    }

    $ConvertedSize = (Get-Item -LiteralPath $TemporaryPath).Length

    # Спочатку перейменовуємо оригінал
    Rename-Item `
        -LiteralPath $File.FullName `
        -NewName $OldFileName

    # Потім тимчасовому файлу повертаємо оригінальне ім'я
    Rename-Item `
        -LiteralPath $TemporaryPath `
        -NewName $File.Name

    $OriginalSizeMb = [math]::Round($OriginalSize / 1MB, 2)
    $ConvertedSizeMb = [math]::Round($ConvertedSize / 1MB, 2)

    if ($OriginalSize -gt 0) {
        $SavedPercent = [math]::Round(
            (1 - ($ConvertedSize / $OriginalSize)) * 100,
            1
        )
    } else {
        $SavedPercent = 0
    }

    Write-Host "Готово." -ForegroundColor Green
    Write-Host "Оригінал:   $OldFileName"
    Write-Host "Новий файл: $($File.Name)"
    Write-Host "Розмір:     $OriginalSizeMb MB → $ConvertedSizeMb MB"
    Write-Host "Економія:   $SavedPercent%"
}

Write-Host ""
Write-Host "Усі доступні відео оброблено." -ForegroundColor Green