param(
  [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'

$url = "http://localhost:$Port"

$commandCandidates = @(
  'responsively-app',
  'Responsively App'
)

$resolvedCommand = $null
foreach ($commandName in $commandCandidates) {
  $commandInfo = Get-Command $commandName -ErrorAction SilentlyContinue
  if ($commandInfo) {
    $resolvedCommand = $commandInfo.Source
    break
  }
}

$whereHits = @()
try {
  $whereHits = @(where.exe responsively-app 2>$null)
} catch {
  $whereHits = @()
}

$candidatePaths = @(
  $resolvedCommand,
  $whereHits,
  "$env:LOCALAPPDATA\Programs\Responsively App\Responsively App.exe",
  "$env:LOCALAPPDATA\Programs\responsively-app\Responsively App.exe",
  "$env:LOCALAPPDATA\Microsoft\WindowsApps\responsively-app.exe",
  "$env:LOCALAPPDATA\Microsoft\WindowsApps\Responsively App.exe",
  "$env:ProgramFiles\Responsively App\Responsively App.exe",
  "$env:ProgramFiles(x86)\Responsively App\Responsively App.exe"
) | Where-Object { $_ }

$responsivelyExe = $candidatePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

$startApp = Get-StartApps | Where-Object {
  $_.Name -like '*Responsively*' -or $_.AppID -like '*responsively*'
} | Select-Object -First 1

if (-not $responsivelyExe -and -not $startApp) {
  Write-Warning "Responsively App executable was not found in common install locations."
  Write-Host "Install it from: https://responsively.app/" -ForegroundColor Yellow
  Write-Host "Then open this URL manually in Responsively: $url" -ForegroundColor Cyan
  exit 1
}

if ($responsivelyExe) {
  Write-Host "Launching Responsively App: $responsivelyExe" -ForegroundColor Cyan
} else {
  Write-Host "Launching Responsively App via AppID: $($startApp.AppID)" -ForegroundColor Cyan
}

Write-Host "Opening URL: $url" -ForegroundColor Cyan

if ($responsivelyExe) {
  Start-Process -FilePath $responsivelyExe -ArgumentList $url | Out-Null
} else {
  Start-Process -FilePath "explorer.exe" -ArgumentList "shell:AppsFolder\$($startApp.AppID)" | Out-Null
  Start-Sleep -Milliseconds 1200
  Start-Process $url | Out-Null
}

Write-Host "Responsively launched." -ForegroundColor Green