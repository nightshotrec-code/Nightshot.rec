param(
    [switch]$DryRun,
    [switch]$Force,
    [switch]$UpdateReferences,
    [int]$JpegQuality = 82,
    [string]$File
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

$script:SystemDrawingReady = $false

function Initialize-SystemDrawing {
    if ($script:SystemDrawingReady) {
        return
    }

    try {
        Add-Type -AssemblyName System.Drawing -ErrorAction Stop
        $script:SystemDrawingReady = $true
    } catch {
        throw "System.Drawing could not be loaded. It is required to apply JPEG EXIF orientation safely. $($_.Exception.Message)"
    }
}

function Get-JpegExifOrientation {
    param([Parameter(Mandatory = $true)][string]$Path)

    Initialize-SystemDrawing

    $image = $null

    try {
        $image = [System.Drawing.Image]::FromFile($Path)
        $orientationId = 0x0112

        if ($image.PropertyIdList -contains $orientationId) {
            $property = $image.GetPropertyItem($orientationId)

            if ($property.Value -and $property.Value.Length -ge 2) {
                $orientation = [BitConverter]::ToUInt16($property.Value, 0)

                if ($orientation -ge 1 -and $orientation -le 8) {
                    return [int]$orientation
                }
            }
        }

        return 1
    } finally {
        if ($null -ne $image) {
            $image.Dispose()
        }
    }
}

function Get-OrientationDescription {
    param([int]$Orientation)

    switch ($Orientation) {
        1 { return "Normal" }
        2 { return "Mirror horizontal" }
        3 { return "Rotate 180" }
        4 { return "Mirror vertical" }
        5 { return "Transpose" }
        6 { return "Rotate 90 CW" }
        7 { return "Transverse" }
        8 { return "Rotate 270 CW" }
        default { return "Unknown" }
    }
}

function New-AutoOrientedPngInput {
    param(
        [Parameter(Mandatory = $true)][string]$SourcePath,
        [Parameter(Mandatory = $true)][int]$Orientation
    )

    if ($Orientation -eq 1) {
        return $null
    }

    Initialize-SystemDrawing

    $temporaryPath = Join-Path `
        -Path ([IO.Path]::GetTempPath()) `
        -ChildPath ("nightshot-auto-orient-" + [Guid]::NewGuid().ToString("N") + ".png")

    $image = $null

    try {
        $image = [System.Drawing.Image]::FromFile($SourcePath)

        $rotateFlip = switch ($Orientation) {
            2 { [System.Drawing.RotateFlipType]::RotateNoneFlipX }
            3 { [System.Drawing.RotateFlipType]::Rotate180FlipNone }
            4 { [System.Drawing.RotateFlipType]::Rotate180FlipX }
            5 { [System.Drawing.RotateFlipType]::Rotate90FlipX }
            6 { [System.Drawing.RotateFlipType]::Rotate90FlipNone }
            7 { [System.Drawing.RotateFlipType]::Rotate270FlipX }
            8 { [System.Drawing.RotateFlipType]::Rotate270FlipNone }
            default { [System.Drawing.RotateFlipType]::RotateNoneFlipNone }
        }

        $image.RotateFlip($rotateFlip)

        # The pixels are now physically oriented, so the EXIF instruction is no longer needed.
        try {
            $image.RemovePropertyItem(0x0112)
        } catch {
            # Some images expose the property as read-only. Saving to PNG removes EXIF orientation anyway.
        }

        # PNG is used only as a temporary lossless pixel container, avoiding an extra JPEG generation loss.
        $image.Save($temporaryPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } catch {
        if (Test-Path -LiteralPath $temporaryPath) {
            Remove-Item -LiteralPath $temporaryPath -Force
        }

        throw "Failed to apply EXIF orientation to '$SourcePath'. $($_.Exception.Message)"
    } finally {
        if ($null -ne $image) {
            $image.Dispose()
        }
    }

    return $temporaryPath
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

if ($File) {
    $resolvedFile = (Resolve-Path -LiteralPath $File).Path
    $imagesRootFull = [IO.Path]::GetFullPath($ImagesRoot).TrimEnd('\') + '\'
    $resolvedFileFull = [IO.Path]::GetFullPath($resolvedFile)

    if (-not $resolvedFileFull.StartsWith($imagesRootFull, [StringComparison]::OrdinalIgnoreCase)) {
        throw "The selected file must be inside: $ImagesRoot"
    }

    $selectedFile = Get-Item -LiteralPath $resolvedFileFull

    if ($selectedFile.Extension.ToLowerInvariant() -notin @(".jpg", ".jpeg", ".png")) {
        throw "Unsupported image type: $($selectedFile.Extension). Use JPG, JPEG, or PNG."
    }

    $Images = @($selectedFile)
} else {
    $Images = @(
        Get-ChildItem -LiteralPath $ImagesRoot -Recurse -File |
            Where-Object {
                $_.Extension.ToLowerInvariant() -in @(".jpg", ".jpeg", ".png")
            }
    )
}

if (-not $Images -or $Images.Count -eq 0) {
    Write-Host "No JPG, JPEG or PNG files found in $ImagesRoot"
    exit 0
}

$Results = New-Object System.Collections.Generic.List[object]

foreach ($Source in $Images) {
    $Destination = Join-Path $Source.DirectoryName ($Source.BaseName + ".webp")
    $RelativeSource = Get-ProjectRelativePath $Source.FullName
    $RelativeDestination = Get-ProjectRelativePath $Destination
    $SourceExtension = $Source.Extension.ToLowerInvariant()
    $IsJpeg = $SourceExtension -in @(".jpg", ".jpeg")
    $ExifOrientation = 1
    $OrientationDescription = "Normal"

    if ($IsJpeg) {
        try {
            $ExifOrientation = Get-JpegExifOrientation -Path $Source.FullName
            $OrientationDescription = Get-OrientationDescription -Orientation $ExifOrientation
        } catch {
            $Results.Add([PSCustomObject]@{
                Source           = $RelativeSource
                Action           = "FAILED: EXIF inspection"
                Orientation      = "Unknown"
                OriginalKB       = [math]::Round($Source.Length / 1KB, 1)
                WebPKB           = "-"
                SavedPercent     = "-"
                ReferenceUpdated = $false
            })

            Write-Warning $_.Exception.Message
            continue
        }
    }

    # Skip when an existing WebP is newer than the source and already smaller.
    # Use -Force once to replace a WebP produced by an older script that ignored EXIF orientation.
    if ((Test-Path -LiteralPath $Destination) -and -not $Force) {
        $ExistingWebp = Get-Item -LiteralPath $Destination

        if (
            $ExistingWebp.LastWriteTimeUtc -ge $Source.LastWriteTimeUtc -and
            $ExistingWebp.Length -lt $Source.Length
        ) {
            $Results.Add([PSCustomObject]@{
                Source           = $RelativeSource
                Action           = "SKIPPED: current WebP exists"
                Orientation      = $OrientationDescription
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
            Orientation      = $OrientationDescription
            OriginalKB       = [math]::Round($Source.Length / 1KB, 1)
            WebPKB           = "-"
            SavedPercent     = "-"
            ReferenceUpdated = $false
        })

        continue
    }

    $TemporaryOutput = "$Destination.tmp"
    $TemporaryOrientedInput = $null

    if (Test-Path -LiteralPath $TemporaryOutput) {
        Remove-Item -LiteralPath $TemporaryOutput -Force
    }

    try {
        $InputPath = $Source.FullName

        if ($IsJpeg -and $ExifOrientation -ne 1) {
            $TemporaryOrientedInput = New-AutoOrientedPngInput `
                -SourcePath $Source.FullName `
                -Orientation $ExifOrientation
            $InputPath = $TemporaryOrientedInput
        }

        if ($SourceExtension -eq ".png") {
            # Lossless conversion preserves screenshots, text, and transparency.
            $Arguments = @(
                "-lossless",
                "-q", "100",
                "-m", "6",
                "-mt",
                "-metadata", "none",
                $InputPath,
                "-o", $TemporaryOutput
            )

            $Mode = "PNG lossless"
        } else {
            # High-quality photographic WebP. EXIF orientation is applied to pixels before encoding.
            $Arguments = @(
                "-q", $JpegQuality.ToString(),
                "-m", "6",
                "-mt",
                "-metadata", "none",
                $InputPath,
                "-o", $TemporaryOutput
            )

            if ($ExifOrientation -eq 1) {
                $Mode = "JPEG quality $JpegQuality"
            } else {
                $Mode = "JPEG quality $JpegQuality + auto-orient $OrientationDescription"
            }
        }

        $PreviousErrorActionPreference = $ErrorActionPreference

        try {
            # cwebp writes normal progress messages to stderr, so do not treat them as terminating errors.
            $ErrorActionPreference = "Continue"
            $ConverterOutput = & $Cwebp @Arguments 2>&1
            $ExitCode = $LASTEXITCODE
        } finally {
            $ErrorActionPreference = $PreviousErrorActionPreference
        }

        if ($ExitCode -ne 0 -or -not (Test-Path -LiteralPath $TemporaryOutput)) {
            if (Test-Path -LiteralPath $TemporaryOutput) {
                Remove-Item -LiteralPath $TemporaryOutput -Force
            }

            $Results.Add([PSCustomObject]@{
                Source           = $RelativeSource
                Action           = "FAILED: $Mode"
                Orientation      = $OrientationDescription
                OriginalKB       = [math]::Round($Source.Length / 1KB, 1)
                WebPKB           = "-"
                SavedPercent     = "-"
                ReferenceUpdated = $false
            })

            Write-Warning "$RelativeSource conversion failed: $($ConverterOutput -join ' ')"
            continue
        }

        $TemporaryFile = Get-Item -LiteralPath $TemporaryOutput
        $GeneratedLength = $TemporaryFile.Length

        # Keep the original when WebP does not save space.
        if ($GeneratedLength -ge $Source.Length) {
            Remove-Item -LiteralPath $TemporaryOutput -Force

            $Results.Add([PSCustomObject]@{
                Source           = $RelativeSource
                Action           = "REJECTED: WebP not smaller"
                Orientation      = $OrientationDescription
                OriginalKB       = [math]::Round($Source.Length / 1KB, 1)
                WebPKB           = [math]::Round($GeneratedLength / 1KB, 1)
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
            Orientation      = $OrientationDescription
            OriginalKB       = [math]::Round($Source.Length / 1KB, 1)
            WebPKB           = [math]::Round($WebpFile.Length / 1KB, 1)
            SavedPercent     = [math]::Round($SavedPercent, 1)
            ReferenceUpdated = $ReferenceUpdated
        })
    } finally {
        if ($TemporaryOrientedInput -and (Test-Path -LiteralPath $TemporaryOrientedInput)) {
            Remove-Item -LiteralPath $TemporaryOrientedInput -Force
        }

        if (Test-Path -LiteralPath $TemporaryOutput) {
            Remove-Item -LiteralPath $TemporaryOutput -Force
        }
    }
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
