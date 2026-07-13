# ------------------------------------------------------------
# NIGHTSHOT — recursive website video optimizer
#
# Expected structure:
# project-root/
#   optimize_videos.ps1
#   assets/
#     media/
#       video/
#         subfolder-1/
#         subfolder-2/
#
# What this script does:
# - Searches recursively through all video subfolders.
# - Groups matching files by directory and base filename.
# - Selects the best available source for each logical video.
# - Creates both an MP4/H.264 and a WebM/VP9 version.
# - Uses ffprobe to skip outputs that are already suitable.
# - Replaces files atomically only after a successful conversion.
# ------------------------------------------------------------

$ErrorActionPreference = "Stop"

# Video folder relative to this script.
$VideoRoot = Join-Path $PSScriptRoot "assets\media\video"

# Source formats that may be used as conversion inputs.
$SupportedExtensions = @(
    ".mp4",
    ".m4v",
    ".mov",
    ".webm"
)

# Website delivery formats generated for every logical video.
$TargetExtensions = @(
    ".mp4",
    ".webm"
)

# Maximum website delivery settings.
$MaxWidth = 1920
$MaxHeight = 1080
$MaxFps = 30

# Files above these average bitrates are considered candidates for
# re-encoding even when codec, dimensions, and frame rate are valid.
$ReencodeHighBitrate = $true
$MaxMp4Bitrate = 8MB   # 8,388,608 bits per second
$MaxWebmBitrate = 5MB  # 5,242,880 bits per second

# Optional safety settings.
# DryRun prints the planned operations without changing any files.
$DryRun = $false

# When enabled, a timestamped copy of every replaced file is retained
# beside the original. This uses additional disk space, so it is disabled
# by default. Git is still strongly recommended before a large batch run.
$CreateBackups = $false

# Encoder settings.
$Mp4Crf = 24
$Mp4Preset = "slow"
$WebmCrf = 32
$WebmCpuUsed = 2

# ------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------

function Convert-RationalToDouble {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return 0.0
    }

    if ($Value -match "^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$") {
        $Numerator = [double]$Matches[1]
        $Denominator = [double]$Matches[2]

        if ($Denominator -ne 0) {
            return $Numerator / $Denominator
        }

        return 0.0
    }

    $Parsed = 0.0
    if ([double]::TryParse(
        $Value,
        [System.Globalization.NumberStyles]::Float,
        [System.Globalization.CultureInfo]::InvariantCulture,
        [ref]$Parsed
    )) {
        return $Parsed
    }

    return 0.0
}

function Get-VideoInfo {
    param([Parameter(Mandatory = $true)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    $ProbeArguments = @(
        "-v", "error"
        "-select_streams", "v:0"
        "-show_entries", "stream=codec_name,width,height,avg_frame_rate,pix_fmt,bit_rate:format=duration,bit_rate"
        "-of", "json"
        $Path
    )

    try {
        $ProbeJson = (& ffprobe @ProbeArguments 2>$null) -join "`n"

        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($ProbeJson)) {
            return $null
        }

        $ProbeData = $ProbeJson | ConvertFrom-Json
        $Stream = @($ProbeData.streams) | Select-Object -First 1

        if ($null -eq $Stream) {
            return $null
        }

        $File = Get-Item -LiteralPath $Path
        $Duration = Convert-RationalToDouble ([string]$ProbeData.format.duration)
        $Fps = Convert-RationalToDouble ([string]$Stream.avg_frame_rate)

        $Bitrate = 0.0

        if ($Stream.bit_rate) {
            $Bitrate = Convert-RationalToDouble ([string]$Stream.bit_rate)
        }

        if ($Bitrate -le 0 -and $ProbeData.format.bit_rate) {
            $Bitrate = Convert-RationalToDouble ([string]$ProbeData.format.bit_rate)
        }

        if ($Bitrate -le 0 -and $Duration -gt 0 -and $File.Length -gt 0) {
            $Bitrate = ($File.Length * 8.0) / $Duration
        }

        $PixelFormat = [string]$Stream.pix_fmt

        return [pscustomobject]@{
            Path             = $File.FullName
            DirectoryName    = $File.DirectoryName
            Name             = $File.Name
            BaseName         = $File.BaseName
            Extension        = $File.Extension.ToLowerInvariant()
            Length           = [int64]$File.Length
            LastWriteTimeUtc = $File.LastWriteTimeUtc
            Codec            = ([string]$Stream.codec_name).ToLowerInvariant()
            Width            = [int]$Stream.width
            Height           = [int]$Stream.height
            Fps              = [double]$Fps
            PixelFormat      = $PixelFormat.ToLowerInvariant()
            Duration         = [double]$Duration
            Bitrate          = [double]$Bitrate
            HasAlpha         = ($PixelFormat -match "^(yuva|rgba|bgra|argb|abgr|gbrap|ya)")
            Pixels           = ([int64]$Stream.width * [int64]$Stream.height)
        }
    }
    catch {
        Write-Warning "Could not inspect video: $Path`n$($_.Exception.Message)"
        return $null
    }
}

function Get-ConversionReasons {
    param(
        [Parameter(Mandatory = $true)][string]$TargetPath,
        [Parameter(Mandatory = $true)][string]$TargetExtension,
        [Parameter(Mandatory = $true)]$SourceInfo
    )

    $Reasons = New-Object System.Collections.Generic.List[string]

    if (-not (Test-Path -LiteralPath $TargetPath)) {
        $Reasons.Add("output is missing")
        return @($Reasons)
    }

    $TargetInfo = Get-VideoInfo -Path $TargetPath

    if ($null -eq $TargetInfo) {
        $Reasons.Add("output cannot be read by ffprobe")
        return @($Reasons)
    }

    if ($TargetInfo.Width -le 0 -or $TargetInfo.Height -le 0 -or $TargetInfo.Duration -le 0) {
        $Reasons.Add("output metadata is invalid")
    }

    if ($TargetInfo.Width -gt $MaxWidth -or $TargetInfo.Height -gt $MaxHeight) {
        $Reasons.Add("resolution exceeds ${MaxWidth}x${MaxHeight}")
    }

    if ($TargetInfo.Fps -gt ($MaxFps + 0.05)) {
        $Reasons.Add("frame rate exceeds $MaxFps fps")
    }

    if ($TargetExtension -eq ".mp4") {
        if ($TargetInfo.Codec -ne "h264") {
            $Reasons.Add("MP4 codec is not H.264")
        }

        if ($TargetInfo.PixelFormat -notin @("yuv420p", "yuvj420p")) {
            $Reasons.Add("MP4 pixel format is not browser-safe 4:2:0")
        }

        if ($ReencodeHighBitrate -and $TargetInfo.Bitrate -gt $MaxMp4Bitrate) {
            $Reasons.Add("average MP4 bitrate is above the configured limit")
        }
    }
    elseif ($TargetExtension -eq ".webm") {
        if ($TargetInfo.Codec -ne "vp9") {
            $Reasons.Add("WebM codec is not VP9")
        }

        if ($TargetInfo.PixelFormat -notin @("yuv420p", "yuva420p")) {
            $Reasons.Add("WebM pixel format is not yuv420p/yuva420p")
        }

        if ($ReencodeHighBitrate -and $TargetInfo.Bitrate -gt $MaxWebmBitrate) {
            $Reasons.Add("average WebM bitrate is above the configured limit")
        }
    }

    # If a different source file is newer than this output, refresh the output.
    $SamePhysicalFile = [System.StringComparer]::OrdinalIgnoreCase.Equals(
        [System.IO.Path]::GetFullPath($TargetPath),
        [System.IO.Path]::GetFullPath($SourceInfo.Path)
    )

    # Only use timestamps when the selected source is a separate master file
    # such as MOV or M4V. Comparing sibling MP4/WebM outputs by timestamp
    # would cause one format to be regenerated on every run.
    $SourceIsSeparateMaster = $SourceInfo.Extension -notin $TargetExtensions

    if (
        $SourceIsSeparateMaster -and
        -not $SamePhysicalFile -and
        $TargetInfo.LastWriteTimeUtc -lt $SourceInfo.LastWriteTimeUtc
    ) {
        $Reasons.Add("output is older than the selected master source")
    }

    return @($Reasons)
}

function Get-BackupPath {
    param([Parameter(Mandatory = $true)][string]$TargetPath)

    $Directory = [System.IO.Path]::GetDirectoryName($TargetPath)
    $BaseName = [System.IO.Path]::GetFileNameWithoutExtension($TargetPath)
    $Extension = [System.IO.Path]::GetExtension($TargetPath)
    $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

    return Join-Path $Directory "$BaseName.original-$Timestamp$Extension"
}

function Invoke-VideoConversion {
    param(
        [Parameter(Mandatory = $true)]$SourceInfo,
        [Parameter(Mandatory = $true)][string]$TargetPath,
        [Parameter(Mandatory = $true)][string]$TargetExtension,
        [Parameter(Mandatory = $true)][string[]]$Reasons
    )

    $TargetDirectory = Split-Path -Parent $TargetPath
    $TargetBaseName = [System.IO.Path]::GetFileNameWithoutExtension($TargetPath)
    $TemporaryPath = Join-Path $TargetDirectory "$TargetBaseName.__converting__$TargetExtension"

    Write-Host "  Target: $TargetPath" -ForegroundColor Cyan
    Write-Host "  Reason: $($Reasons -join '; ')" -ForegroundColor Yellow

    if ($DryRun) {
        Write-Host "  DRY RUN: conversion skipped." -ForegroundColor DarkYellow
        return $true
    }

    if (Test-Path -LiteralPath $TemporaryPath) {
        Remove-Item -LiteralPath $TemporaryPath -Force
    }

    $Filters = @()

    if ($SourceInfo.Fps -gt ($MaxFps + 0.05)) {
        $Filters += "fps=$MaxFps"
    }

    # Smaller videos are never enlarged. Larger videos are reduced while
    # preserving their original aspect ratio and using even dimensions.
    $Filters += "scale='min($MaxWidth,iw)':'min($MaxHeight,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2"
    $Filters += "setsar=1"

    $VideoFilter = $Filters -join ","

    $FfmpegArguments = @(
        "-y"
        "-hide_banner"
        "-loglevel", "error"
        "-i", $SourceInfo.Path
        "-map", "0:v:0"
        "-an"
        "-map_metadata", "-1"
        "-map_chapters", "-1"
        "-vf", $VideoFilter
    )

    if ($TargetExtension -eq ".webm") {
        $WebmPixelFormat = if ($SourceInfo.HasAlpha) { "yuva420p" } else { "yuv420p" }

        $FfmpegArguments += @(
            "-c:v", "libvpx-vp9"
            "-crf", "$WebmCrf"
            "-b:v", "0"
            "-deadline", "good"
            "-cpu-used", "$WebmCpuUsed"
            "-row-mt", "1"
            "-pix_fmt", $WebmPixelFormat
        )

        if ($SourceInfo.HasAlpha) {
            $FfmpegArguments += @("-auto-alt-ref", "0")
        }
    }
    else {
        $FfmpegArguments += @(
            "-c:v", "libx264"
            "-preset", $Mp4Preset
            "-crf", "$Mp4Crf"
            "-pix_fmt", "yuv420p"
            "-movflags", "+faststart"
        )
    }

    $FfmpegArguments += $TemporaryPath

    & ffmpeg @FfmpegArguments

    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $TemporaryPath)) {
        Write-Host "  Conversion failed. Existing files were not changed." -ForegroundColor Red

        if (Test-Path -LiteralPath $TemporaryPath) {
            Remove-Item -LiteralPath $TemporaryPath -Force
        }

        return $false
    }

    $TemporaryInfo = Get-VideoInfo -Path $TemporaryPath

    if ($null -eq $TemporaryInfo -or $TemporaryInfo.Width -le 0 -or $TemporaryInfo.Height -le 0 -or $TemporaryInfo.Duration -le 0) {
        Write-Host "  Converted file failed validation. Existing files were not changed." -ForegroundColor Red
        Remove-Item -LiteralPath $TemporaryPath -Force
        return $false
    }

    if ($TargetExtension -eq ".mp4" -and $TemporaryInfo.Codec -ne "h264") {
        Write-Host "  Converted MP4 is not H.264. Existing files were not changed." -ForegroundColor Red
        Remove-Item -LiteralPath $TemporaryPath -Force
        return $false
    }

    if ($TargetExtension -eq ".webm" -and $TemporaryInfo.Codec -ne "vp9") {
        Write-Host "  Converted WebM is not VP9. Existing files were not changed." -ForegroundColor Red
        Remove-Item -LiteralPath $TemporaryPath -Force
        return $false
    }

    $PreviousSize = 0

    if (Test-Path -LiteralPath $TargetPath) {
        $PreviousSize = (Get-Item -LiteralPath $TargetPath).Length

        if ($CreateBackups) {
            $BackupPath = Get-BackupPath -TargetPath $TargetPath
            Move-Item -LiteralPath $TargetPath -Destination $BackupPath
            Write-Host "  Backup: $BackupPath" -ForegroundColor DarkGray
        }
        else {
            Remove-Item -LiteralPath $TargetPath -Force
        }
    }

    Move-Item -LiteralPath $TemporaryPath -Destination $TargetPath

    $NewSize = (Get-Item -LiteralPath $TargetPath).Length
    $NewSizeMb = [math]::Round($NewSize / 1MB, 2)

    if ($PreviousSize -gt 0) {
        $PreviousSizeMb = [math]::Round($PreviousSize / 1MB, 2)
        $SavedPercent = [math]::Round((1 - ($NewSize / $PreviousSize)) * 100, 1)
        Write-Host "  Complete: $PreviousSizeMb MB -> $NewSizeMb MB ($SavedPercent% saved)" -ForegroundColor Green
    }
    else {
        Write-Host "  Complete: created $NewSizeMb MB" -ForegroundColor Green
    }

    return $true
}

# ------------------------------------------------------------
# Environment checks
# ------------------------------------------------------------

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    throw "FFmpeg was not found. Verify the installation with: ffmpeg -version"
}

if (-not (Get-Command ffprobe -ErrorAction SilentlyContinue)) {
    throw "FFprobe was not found. It should be installed together with FFmpeg."
}

if (-not (Test-Path -LiteralPath $VideoRoot)) {
    throw "Video folder was not found: $VideoRoot"
}

Write-Host ""
Write-Host "Video folder: $VideoRoot" -ForegroundColor Cyan
Write-Host "Dry run:      $DryRun"
Write-Host "Backups:      $CreateBackups"
Write-Host ""

# ------------------------------------------------------------
# Find and inspect every source video
# ------------------------------------------------------------

$VideoFiles = @(
    Get-ChildItem -LiteralPath $VideoRoot -Recurse -File |
    Where-Object {
        $_.Extension.ToLowerInvariant() -in $SupportedExtensions -and
        $_.BaseName -notmatch "_old$" -and
        $_.BaseName -notmatch "\.__converting__$" -and
        $_.BaseName -notmatch "\.original-\d{8}-\d{6}$"
    }
)

if ($VideoFiles.Count -eq 0) {
    Write-Host "No video files were found." -ForegroundColor Yellow
    exit 0
}

Write-Host "Video files found: $($VideoFiles.Count)" -ForegroundColor Green
Write-Host "Inspecting metadata..." -ForegroundColor DarkGray

$InspectedVideos = @()

foreach ($File in $VideoFiles) {
    $Info = Get-VideoInfo -Path $File.FullName

    if ($null -ne $Info) {
        $InspectedVideos += $Info
    }
    else {
        Write-Warning "Skipping unreadable video: $($File.FullName)"
    }
}

if ($InspectedVideos.Count -eq 0) {
    Write-Host "No readable video streams were found." -ForegroundColor Red
    exit 1
}

# Group sibling formats such as name.mp4 and name.webm into one logical video.
$VideoGroups = @(
    $InspectedVideos | Group-Object {
        ($_.DirectoryName.ToLowerInvariant() + "|" + $_.BaseName.ToLowerInvariant())
    }
)

$ExtensionPriority = @{
    ".mov"  = 4
    ".m4v"  = 3
    ".mp4"  = 2
    ".webm" = 1
}

$CreatedCount = 0
$UpdatedCount = 0
$SkippedCount = 0
$FailedCount = 0

# ------------------------------------------------------------
# Create or refresh both delivery formats
# ------------------------------------------------------------

foreach ($Group in $VideoGroups) {
    $Candidates = @($Group.Group)

    # Prefer the highest-resolution and highest-quality available source.
    # Container preference is used only after resolution, FPS, and bitrate.
    $SourceInfo = $Candidates |
        Sort-Object -Property `
            @{ Expression = { $_.Pixels }; Descending = $true }, `
            @{ Expression = { $_.Fps }; Descending = $true }, `
            @{ Expression = { $_.Bitrate }; Descending = $true }, `
            @{ Expression = { $ExtensionPriority[$_.Extension] }; Descending = $true }, `
            @{ Expression = { $_.Length }; Descending = $true } |
        Select-Object -First 1

    if ($null -eq $SourceInfo) {
        continue
    }

    Write-Host ""
    Write-Host "------------------------------------------------------------"
    Write-Host "Video:  $($SourceInfo.BaseName)" -ForegroundColor White
    Write-Host "Folder: $($SourceInfo.DirectoryName)" -ForegroundColor DarkGray
    Write-Host "Source: $($SourceInfo.Name) [$($SourceInfo.Codec), $($SourceInfo.Width)x$($SourceInfo.Height), $([math]::Round($SourceInfo.Fps, 2)) fps]" -ForegroundColor Cyan

    # If the source is already one of the delivery formats, process the other
    # format first. This prevents the source from being replaced before it has
    # been used to generate its sibling format.
    $OrderedTargets = @(
        $TargetExtensions | Sort-Object {
            if ($_ -eq $SourceInfo.Extension) { 1 } else { 0 }
        }
    )

    foreach ($TargetExtension in $OrderedTargets) {
        $TargetPath = Join-Path $SourceInfo.DirectoryName ($SourceInfo.BaseName + $TargetExtension)
        $TargetExistedBefore = Test-Path -LiteralPath $TargetPath
        $Reasons = @(Get-ConversionReasons `
            -TargetPath $TargetPath `
            -TargetExtension $TargetExtension `
            -SourceInfo $SourceInfo)

        if ($Reasons.Count -eq 0) {
            Write-Host "  Skip: $([System.IO.Path]::GetFileName($TargetPath)) is already suitable." -ForegroundColor DarkGreen
            $SkippedCount++
            continue
        }

        $Success = Invoke-VideoConversion `
            -SourceInfo $SourceInfo `
            -TargetPath $TargetPath `
            -TargetExtension $TargetExtension `
            -Reasons $Reasons

        if ($Success) {
            if ($TargetExistedBefore) {
                $UpdatedCount++
            }
            else {
                $CreatedCount++
            }
        }
        else {
            $FailedCount++
        }
    }
}

Write-Host ""
Write-Host "============================================================"
Write-Host "Video optimization finished." -ForegroundColor Green
Write-Host "Created: $CreatedCount"
Write-Host "Updated: $UpdatedCount"
Write-Host "Skipped: $SkippedCount"
Write-Host "Failed:  $FailedCount"

if ($DryRun) {
    Write-Host "No files were changed because DryRun is enabled." -ForegroundColor Yellow
}
elseif (-not $CreateBackups) {
    Write-Host "Replaced files were not retained as backups." -ForegroundColor DarkYellow
}

if ($FailedCount -gt 0) {
    exit 1
}
