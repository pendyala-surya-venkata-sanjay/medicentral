# Waits for Docker Engine, then starts MediCentral (docker compose up -d).
# Used by Windows autostart scheduled task and can be run manually.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$LogDir = Join-Path $Root "logs"
$LogFile = Join-Path $LogDir "docker-autostart.log"
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

function Write-Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Add-Content -Path $LogFile -Value $line
  Write-Host $line
}

Write-Log "MediCentral autostart: waiting for Docker Engine..."

$maxAttempts = 90
$ready = $false
for ($i = 1; $i -le $maxAttempts; $i++) {
  docker info 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $ready) {
  Write-Log "Docker Engine not available after $($maxAttempts * 2)s. Is Docker Desktop running?"
  exit 1
}

Write-Log "Docker is ready."

$envDocker = Join-Path $Root ".env.docker"
$envExample = Join-Path $Root ".env.docker.example"
if (-not (Test-Path $envDocker) -and (Test-Path $envExample)) {
  Copy-Item $envExample $envDocker
  Write-Log "Created .env.docker from .env.docker.example"
}

Write-Log "Starting stack (docker compose up -d)..."
docker compose up -d 2>&1 | ForEach-Object { Write-Log $_ }

if ($LASTEXITCODE -ne 0) {
  Write-Log "docker compose up failed (exit $LASTEXITCODE). Try: docker compose up --build -d"
  exit $LASTEXITCODE
}

Write-Log "MediCentral is up. Web: http://localhost  API: http://localhost:5000/health/ready"
exit 0
