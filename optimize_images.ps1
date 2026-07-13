param(
    [switch]$DryRun,
    [switch]$Force,
    [switch]$UpdateReferences,
    [int]$JpegQuality = 82
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Get-Location).Path
$ImagesRoot = Join-Path $ProjectRoot "assets\media\images"
$IndexPath = Join-Path $ProjectRoot "index.html"

if (-not (Test-Path -LiteralPath $ImagesRoot)) {
    throw "Images folder not found: $ImagesRoot"
}

# Find cwebp in PATH or use the known installation location.
$cwebpCommand = Get-Command "cwebp" -ErrorAction SilentlyContinue

if ($cwebpCommand) {
    $Cwebp = $cwebpCommand.Source
} else {
    $Cwebp = "C:\Tools\libwebp-1.6.0-windows-x64\bin\cwebp.exe"
}

if (-not (Test-Path -LiteralPath $Cwebp)) {
    throw "cwebp was not found. Expected location: $Cwebp"
}

function Get-ProjectRelativePath {
    param([string]$FullPath)

    return $FullPath.Substring($ProjectRoot.Length).
        TrimStart([char[]]@('\', '/')).
        Replace('\', '/')
}

function Convert-ToUrlPath {
    param([string]$Path)

    return (($Path -split '/') | ForEach-Object {
        [Uri]::EscapeDataString($_)
    }) -join '/'
}

$IndexContent = $null
$IndexChanged = $false

if ($UpdateReferences -and (Test-Path -LiteralPath $IndexPath)) {
    $IndexContent = [IO.File]::ReadAllText($IndexPath)
}

$Images = Get-ChildItem -LiteralPath $ImagesRoot -Recurse -File |
    Where-Object {
        $_.Extension.ToLowerInvariant() -in @(".jpg", ".jpeg", ".png")
    }

if (-not $Images) {
    Write-Host "No JPG, JPEG or PNG files found in $ImagesRoot"
    exit 0
}

$Results = New-Object System.Collections.Generic.List[object]

foreach ($Source in $Images) {
    $Destination = Join-Path $Source.DirectoryName ($Source.BaseName + ".webp")
    $RelativeSource = Get-ProjectRelativePath $Source.FullName
    $RelativeDestination = Get-ProjectRelativePath $Destination

    # Skip when an existing WebP is newer than the source and already smaller.
    if ((Test-Path -LiteralPath $Destination) -and -not $Force) {
        $ExistingWebp = Get-Item -LiteralPath $Destination

        if (
            $ExistingWebp.LastWriteTimeUtc -ge $Source.LastWriteTimeUtc -and
            $ExistingWebp.Length -lt $Source.Length
        ) {
            $Results.Add([PSCustomObject]@{
                Source           = $RelativeSource
                Action           = "SKIPPED: current WebP exists"
                OriginalKB       = [math]::Round($Source.Length / 1KB, 1)
                WebPKB           = [math]::Round($ExistingWebp.Length / 1KB, 1)
                SavedPercent     = [math]::Round((1 - ($ExistingWebp.Length / $Source.Length)) * 100, 1)
                ReferenceUpdated = $false
            })

            continue
        }
    }

    if ($DryRun) {
        $Results.Add([PSCustomObject]@{
            Source           = $RelativeSource
            Action           = "WOULD CONVERT"
            OriginalKB       = [math]::Round($Source.Length / 1KB, 1)
            WebPKB           = "-"
            SavedPercent     = "-"
            ReferenceUpdated = $false
        })

        continue
    }

    $TemporaryOutput = "$Destination.tmp"

    if (Test-Path -LiteralPath $TemporaryOutput) {
        Remove-Item -LiteralPath $TemporaryOutput -Force
    }

    if ($Source.Extension.ToLowerInvariant() -eq ".png") {
        # Lossless conversion preserves screenshots, text and transparency.
        $Arguments = @(
            "-lossless",
            "-q", "100",
            "-m", "6",
            "-mt",
            "-metadata", "none",
            $Source.FullName,
            "-o", $TemporaryOutput
        )

        $Mode = "PNG lossless"
    } else {
        # High-quality photographic WebP.
        $Arguments = @(
            "-q", $JpegQuality.ToString(),
            "-m", "6",
            "-mt",
            "-metadata", "none",
            $Source.FullName,
            "-o", $TemporaryOutput
        )

        $Mode = "JPEG quality $JpegQuality"
    }

    $PreviousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $ConverterOutput = & $Cwebp @Arguments 2>&1
    $ExitCode = $LASTEXITCODE
    $ErrorActionPreference = $PreviousErrorActionPreference

    if ($ExitCode -ne 0 -or -not (Test-Path -LiteralPath $TemporaryOutput)) {
        if (Test-Path -LiteralPath $TemporaryOutput) {
            Remove-Item -LiteralPath $TemporaryOutput -Force
        }

        $Results.Add([PSCustomObject]@{
            Source           = $RelativeSource
            Action           = "FAILED: $Mode"
            OriginalKB       = [math]::Round($Source.Length / 1KB, 1)
            WebPKB           = "-"
            SavedPercent     = "-"
            ReferenceUpdated = $false
        })

        Write-Warning "$RelativeSource conversion failed: $($ConverterOutput -join ' ')"
        continue
    }

    $TemporaryFile = Get-Item -LiteralPath $TemporaryOutput

    # Keep the original when WebP does not save space.
    if ($TemporaryFile.Length -ge $Source.Length) {
        Remove-Item -LiteralPath $TemporaryOutput -Force

        $Results.Add([PSCustomObject]@{
            Source           = $RelativeSource
            Action           = "REJECTED: WebP not smaller"
            OriginalKB       = [math]::Round($Source.Length / 1KB, 1)
            WebPKB           = [math]::Round($TemporaryFile.Length / 1KB, 1)
            SavedPercent     = 0
            ReferenceUpdated = $false
        })

        continue
    }

    Move-Item -LiteralPath $TemporaryOutput -Destination $Destination -Force

    $WebpFile = Get-Item -LiteralPath $Destination
    $WebpFile.LastWriteTimeUtc = $Source.LastWriteTimeUtc

    $ReferenceUpdated = $false

    if ($UpdateReferences -and $null -ne $IndexContent) {
        $EncodedSource = Convert-ToUrlPath $RelativeSource
        $EncodedDestination = Convert-ToUrlPath $RelativeDestination

        $PreviousContent = $IndexContent

        # Supports both normal paths and paths containing %20.
        $IndexContent = $IndexContent.Replace(
            $EncodedSource,
            $EncodedDestination
        )

        $IndexContent = $IndexContent.Replace(
            $RelativeSource,
            $RelativeDestination
        )

        if ($IndexContent -ne $PreviousContent) {
            $ReferenceUpdated = $true
            $IndexChanged = $true
        }
    }

    $SavedPercent = (1 - ($WebpFile.Length / $Source.Length)) * 100

    $Results.Add([PSCustomObject]@{
        Source           = $RelativeSource
        Action           = "CONVERTED: $Mode"
        OriginalKB       = [math]::Round($Source.Length / 1KB, 1)
        WebPKB           = [math]::Round($WebpFile.Length / 1KB, 1)
        SavedPercent     = [math]::Round($SavedPercent, 1)
        ReferenceUpdated = $ReferenceUpdated
    })
}

if ($UpdateReferences -and $IndexChanged -and -not $DryRun) {
    $Utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($IndexPath, $IndexContent, $Utf8WithoutBom)

    Write-Host ""
    Write-Host "index.html references updated."
}

Write-Host ""
$Results | Format-Table -AutoSize

$Converted = @($Results | Where-Object { $_.Action -like "CONVERTED*" }).Count
$Skipped = @($Results | Where-Object { $_.Action -like "SKIPPED*" }).Count
$Rejected = @($Results | Where-Object { $_.Action -like "REJECTED*" }).Count
$Failed = @($Results | Where-Object { $_.Action -like "FAILED*" }).Count

Write-Host ""
Write-Host "Converted: $Converted"
Write-Host "Skipped:   $Skipped"
Write-Host "Rejected:  $Rejected"
Write-Host "Failed:    $Failed"

if ($Failed -gt 0) {
    exit 1
}
