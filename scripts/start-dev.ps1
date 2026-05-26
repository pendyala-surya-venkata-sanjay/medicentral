# MediCentral — start all dev services (Windows)
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "Starting MediCentral..." -ForegroundColor Cyan

# Backend (port 5000)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Frontend (port 5173)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 4

# ML service (port 8000) — optional
if (Test-Path "$root\ml-service") {
  $mlMain = Get-ChildItem "$root\ml-service" -Filter "*.py" -Recurse | Where-Object { $_.Name -match 'main|app' } | Select-Object -First 1
  if ($mlMain) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\ml-service'; python -m uvicorn $($mlMain.BaseName):app --reload --port 8000" -WindowStyle Minimized
  }
}

Start-Process "http://localhost:5173"
Write-Host "`nOpen: http://localhost:5173" -ForegroundColor Green
Write-Host "API:  http://localhost:5000" -ForegroundColor Green
Write-Host "`nEnsure MongoDB is running (local service or Atlas with IP whitelisted)." -ForegroundColor Yellow
