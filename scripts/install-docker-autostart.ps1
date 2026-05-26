# Registers a Windows scheduled task to start MediCentral when you sign in (after Docker is ready).
# Run once from an elevated or normal PowerShell:
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#   .\scripts\install-docker-autostart.ps1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$StartScript = Join-Path $Root "scripts\docker-wait-and-start.ps1"
$TaskName = "MediCentral-Docker-Autostart"

if (-not (Test-Path $StartScript)) {
  Write-Error "Missing $StartScript"
}

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$StartScript`"" `
  -WorkingDirectory $Root

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Starts MediCentral (docker compose) when Windows starts, after Docker Desktop is ready." `
  -Force | Out-Null

Write-Host ""
Write-Host "Installed scheduled task: $TaskName" -ForegroundColor Green
Write-Host "  Runs at sign-in -> waits for Docker -> docker compose up -d"
Write-Host ""
Write-Host "Also enable in Docker Desktop:" -ForegroundColor Cyan
Write-Host "  Settings -> General -> Start Docker Desktop when you sign in to your computer"
Write-Host ""
Write-Host "One-time (first build):" -ForegroundColor Cyan
Write-Host "  cd $Root"
Write-Host "  docker compose up --build -d"
Write-Host ""
Write-Host "Remove autostart:" -ForegroundColor Yellow
Write-Host "  Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
Write-Host ""
