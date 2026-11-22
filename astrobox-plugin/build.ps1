param([switch]$Offline)

$ErrorActionPreference = 'Stop'

$pluginRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$dist = [System.IO.Path]::GetFullPath((Join-Path $pluginRoot 'dist'))
$target = Join-Path $pluginRoot 'target\wasm32-wasip2\release\band_browser_plugin.wasm'
$icon = Join-Path $pluginRoot 'icon.png'

if (-not (Test-Path -LiteralPath $icon -PathType Leaf)) {
    throw "Plugin icon is missing: $icon"
}

$cargoCommand = Get-Command cargo -ErrorAction SilentlyContinue
if ($cargoCommand) {
    $cargoExe = $cargoCommand.Source
} else {
    $cargoExe = Join-Path $env:USERPROFILE '.cargo\bin\cargo.exe'
}
if (-not (Test-Path -LiteralPath $cargoExe -PathType Leaf)) {
    throw "cargo is missing; install the Rust stable toolchain first"
}

$cargoArguments = @('build', '--manifest-path', (Join-Path $pluginRoot 'Cargo.toml'), '--target', 'wasm32-wasip2', '--release')
if ($Offline) { $cargoArguments += '--offline' }
& $cargoExe @cargoArguments
if ($LASTEXITCODE -ne 0) {
    throw "cargo build failed with exit code $cargoExitCode"
}

if (Test-Path -LiteralPath $dist) {
    Remove-Item -LiteralPath $dist -Recurse -Force
}
New-Item -ItemType Directory -Path $dist | Out-Null
Copy-Item -Force $target (Join-Path $dist 'band_browser_sync.wasm')
Copy-Item -Force (Join-Path $pluginRoot 'manifest.json') (Join-Path $dist 'manifest.json')
Copy-Item -Force $icon (Join-Path $dist 'icon.png')

$manifest = Get-Content -LiteralPath (Join-Path $pluginRoot 'manifest.json') -Encoding UTF8 -Raw | ConvertFrom-Json
$archiveName = "Band-Browser-$($manifest.version)"
$archive = Join-Path $dist "$archiveName.abp"
$archiveZip = Join-Path $dist "$archiveName.zip"
$packageFiles = @(
    (Join-Path $dist 'manifest.json'),
    (Join-Path $dist 'icon.png'),
    (Join-Path $dist 'band_browser_sync.wasm')
)
Compress-Archive -Path $packageFiles -DestinationPath $archiveZip -Force
Move-Item -Force $archiveZip $archive
Write-Output "Built .abp: $archive"
