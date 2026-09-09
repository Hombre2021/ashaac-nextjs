param(
  [int]$Port = 3000
)

$ErrorActionPreference = 'Continue'

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
$projectRoot = Split-Path -Parent $scriptDir

if (-not (Test-Path (Join-Path $projectRoot 'package.json'))) {
  $projectRoot = $scriptDir
}

Push-Location $projectRoot

try {
  $env:NODE_OPTIONS = '--max-old-space-size=4096'
  Write-Host "Starting All Solutions HVAC development server on port $Port..." -ForegroundColor Cyan

  $npmCmd = if (Get-Command 'npm.cmd' -ErrorAction SilentlyContinue) {
    'npm.cmd'
  } elseif (Get-Command 'npm' -ErrorAction SilentlyContinue) {
    'npm'
  } else {
    'npm'
  }

  & $npmCmd run dev -- --port $Port
}
finally {
  Pop-Location
}
