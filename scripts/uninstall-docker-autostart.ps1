Unregister-ScheduledTask -TaskName "MediCentral-Docker-Autostart" -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "Removed MediCentral-Docker-Autostart scheduled task." -ForegroundColor Green
