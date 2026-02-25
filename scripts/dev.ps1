param(
  [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'

$pwshPath = Join-Path $env:ProgramFiles 'PowerShell\7\pwsh.exe'
if ($PSVersionTable.PSEdition -ne 'Core' -and (Test-Path $pwshPath)) {
  & $pwshPath -NoLogo -NoProfile -ExecutionPolicy Bypass -File $PSCommandPath -Port $Port
  exit $LASTEXITCODE
}

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

$env:NODE_OPTIONS = '--max-old-space-size=4096'
npm.cmd run dev -- --port $Port