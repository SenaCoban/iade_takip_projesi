# Build the docker images and package them as .tar.gz for transfer/deployment.
# Run this on a Windows machine with Docker Desktop:  .\build-and-package.ps1
#
#   -NoCache   Force a clean rebuild (no layer cache). Default: on, so every
#              package is guaranteed to contain the latest source.
#   -Clean     Remove dangling images after building to reclaim disk space.
param(
    [bool]$NoCache = $true,
    [switch]$Clean
)
$ErrorActionPreference = 'Stop'

$BackendImage  = 'iade-takip-sistemi-backend:latest'
$FrontendImage = 'iade-takip-sistemi-frontend:latest'
$OutDir        = 'dist'

function Save-DockerImageGz {
    param([string]$Image, [string]$OutFile)

    $tar = [System.IO.Path]::ChangeExtension($OutFile, '.tar')
    Write-Host ">> Saving $Image -> $OutFile"
    docker save -o $tar $Image
    if ($LASTEXITCODE -ne 0) { throw "docker save failed for $Image" }

    # Gzip the .tar with .NET, then drop the intermediate .tar
    $in  = [System.IO.File]::OpenRead($tar)
    $out = [System.IO.File]::Create($OutFile)
    $gz  = New-Object System.IO.Compression.GZipStream($out, [System.IO.Compression.CompressionLevel]::Optimal)
    try   { $in.CopyTo($gz) }
    finally { $gz.Dispose(); $out.Dispose(); $in.Dispose() }
    Remove-Item $tar
}

$buildArgs = @('compose', 'build', 'backend', 'frontend')
if ($NoCache) {
    $buildArgs += '--no-cache'
    Write-Host '>> Building images (no cache, clean rebuild)...'
} else {
    Write-Host '>> Building images (cached)...'
}
docker @buildArgs
if ($LASTEXITCODE -ne 0) { throw 'docker compose build failed' }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Save-DockerImageGz -Image $BackendImage  -OutFile (Join-Path $OutDir 'backend.tar.gz')
Save-DockerImageGz -Image $FrontendImage -OutFile (Join-Path $OutDir 'frontend.tar.gz')

if ($Clean) {
    Write-Host '>> Pruning dangling images on this build machine...'
    docker image prune -f | Out-Null
}

Write-Host ">> Done. Artifacts in $OutDir\:"
Get-ChildItem -Path $OutDir -Filter *.tar.gz | Format-Table Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,1)}}

Write-Host @'

To deploy on the target (air-gapped) host:
  docker compose down                 # stop old containers, free old images
  docker load -i backend.tar.gz       # retags :latest to the new image
  docker load -i frontend.tar.gz
  docker compose up -d
  docker image prune -f               # remove the now-dangling old images

Verify the running container has the new code:
  docker compose exec frontend grep -n "API_BASE" src/components/Login.js
'@
