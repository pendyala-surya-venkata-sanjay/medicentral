# MediCentral — local dev (Windows): API + frontend (+ optional ML)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "MediCentral local dev" -ForegroundColor Cyan

# Ensure env files exist
if (-not (Test-Path "$root\backend\.env")) {
  Copy-Item "$root\backend\.env.example" "$root\backend\.env"
  Write-Host "Created backend\.env from example" -ForegroundColor Yellow
}
if (-not (Test-Path "$root\frontend\.env")) {
  Copy-Item "$root\frontend\.env.example" "$root\frontend\.env"
  Write-Host "Created frontend\.env from example" -ForegroundColor Yellow
}

# MongoDB via Docker (optional — skip if you already run Mongo locally)
$mongoRunning = $false
try {
  docker info 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Starting MongoDB container..." -ForegroundColor Gray
    docker compose -f "$root\docker-compose.yml" up -d mongo 2>$null
    $mongoRunning = $true
  }
} catch {
  Write-Host "Docker not running — use local MongoDB service or Atlas in backend\.env" -ForegroundColor Yellow
}

Write-Host "Starting backend on http://localhost:5000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$root\backend'; Write-Host 'Backend API' -ForegroundColor Cyan; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 4

Write-Host "Starting frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$root\frontend'; Write-Host 'Frontend' -ForegroundColor Cyan; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 3

# ML service (optional — symptom assistant / OCR)
if (Test-Path "$root\ml-service\app.py") {
  Write-Host "Starting ML service on http://localhost:8000 (optional) ..." -ForegroundColor Gray
  Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$root\ml-service'; if (Test-Path .\venv\Scripts\Activate.ps1) { .\venv\Scripts\Activate.ps1 }; python -m uvicorn app:app --reload --port 8000"
  ) -WindowStyle Minimized
}

Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "  App:  http://localhost:5173" -ForegroundColor Green
Write-Host "  API:  http://localhost:5000/health" -ForegroundColor Green
Write-Host ""
Write-Host "Register patient, doctor, and staff accounts at /register" -ForegroundColor Yellow
if ($mongoRunning) {
  Write-Host "MongoDB: docker container medicentral-mongo on port 27017" -ForegroundColor Gray
}
