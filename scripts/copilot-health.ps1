param(
  [ValidateSet('status', 'quick-clean', 'deep-clean', 'repair')]
  [string]$Action = 'status',
  [switch]$ResetVSCodeWorkspaceStorage
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

function Remove-PathIfExists {
  param([string]$Path)

  if (Test-Path $Path) {
    Write-Host "Removing: $Path" -ForegroundColor Yellow
    Remove-Item -Recurse -Force $Path
  } else {
    Write-Host "Not found (skip): $Path" -ForegroundColor DarkGray
  }
}

function Show-Status {
  $targets = @(
    '.next',
    '.vercel',
    'node_modules',
    'package-lock.json'
  )

  Write-Host ''
  Write-Host 'Copilot/Workspace health status' -ForegroundColor Cyan
  foreach ($target in $targets) {
    $exists = Test-Path $target
    $label = if ($exists) { 'present' } else { 'missing' }
    $color = if ($exists) { 'Yellow' } else { 'Green' }
    Write-Host (" - {0}: {1}" -f $target, $label) -ForegroundColor $color
  }

  $workspaceStorage = Join-Path $env:APPDATA 'Code\User\workspaceStorage'
  $workspaceStorageStatus = if (Test-Path $workspaceStorage) { 'present' } else { 'missing' }
  Write-Host (" - VS Code workspaceStorage: {0}" -f $workspaceStorageStatus) -ForegroundColor DarkCyan
  Write-Host ''
}

function Quick-Clean {
  Write-Host 'Running quick clean (.next + .vercel)...' -ForegroundColor Cyan
  Remove-PathIfExists '.next'
  Remove-PathIfExists '.vercel'
}

function Deep-Clean {
  Write-Host 'Running deep clean (.next + .vercel + node_modules + package-lock.json)...' -ForegroundColor Cyan
  Remove-PathIfExists '.next'
  Remove-PathIfExists '.vercel'
  Remove-PathIfExists 'node_modules'
  Remove-PathIfExists 'package-lock.json'
}

function Reset-WorkspaceStorage {
  $workspaceStorage = Join-Path $env:APPDATA 'Code\User\workspaceStorage'
  if (-not $env:APPDATA) {
    Write-Warning 'APPDATA is not set. Skipping VS Code workspaceStorage reset.'
    return
  }

  Write-Host 'Resetting VS Code workspaceStorage...' -ForegroundColor Cyan
  Remove-PathIfExists $workspaceStorage
}

switch ($Action) {
  'status' {
    Show-Status
  }
  'quick-clean' {
    Quick-Clean
    if ($ResetVSCodeWorkspaceStorage) {
      Reset-WorkspaceStorage
    }
    Show-Status
  }
  'deep-clean' {
    Deep-Clean
    if ($ResetVSCodeWorkspaceStorage) {
      Reset-WorkspaceStorage
    }
    Show-Status
  }
  'repair' {
    Deep-Clean
    if ($ResetVSCodeWorkspaceStorage) {
      Reset-WorkspaceStorage
    }

    Write-Host 'Reinstalling dependencies (npm install)...' -ForegroundColor Cyan
    npm.cmd install

    Write-Host 'Running Next.js production build (npm run build)...' -ForegroundColor Cyan
    npm.cmd run build

    Show-Status
  }
}