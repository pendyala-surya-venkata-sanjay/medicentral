# Start MediCentral on Docker Desktop (from repo root)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "Docker is not installed or not on PATH. Install Docker Desktop first."
}

Write-Host "Building and starting MediCentral (mongo, api, ml, web)..." -ForegroundColor Cyan
docker compose up --build -d

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "MediCentral is starting. Wait ~30-60s for health checks." -ForegroundColor Green
Write-Host "  Web:  http://localhost"
Write-Host "  API:  http://localhost:5000/health/ready"
Write-Host "  Logs: docker compose logs -f"
Write-Host ""
