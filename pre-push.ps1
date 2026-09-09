param()

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSCommandPath
Set-Location $repoRoot

function Test-UpstreamExists {
	git rev-parse --abbrev-ref --symbolic-full-name "@{u}" *> $null
	return ($LASTEXITCODE -eq 0)
}

function Get-ChangedFilesAgainstUpstream {
	$changedFiles = git diff --name-only "@{u}...HEAD"
	if ($LASTEXITCODE -ne 0) {
		throw 'Unable to compare current branch with upstream.'
	}

	return $changedFiles
}

$shouldInstallDependencies = $false
$installReason = ''

if (-not (Test-Path 'node_modules')) {
	$shouldInstallDependencies = $true
	$installReason = 'node_modules is missing'
} elseif (-not (Test-Path 'package-lock.json')) {
	$shouldInstallDependencies = $true
	$installReason = 'package-lock.json is missing'
} elseif (-not (Test-UpstreamExists)) {
	$shouldInstallDependencies = $true
	$installReason = 'no upstream branch is configured yet'
} else {
	$changedFiles = Get-ChangedFilesAgainstUpstream
	$dependencyFilesChanged = $changedFiles | Where-Object {
		$_ -eq 'package.json' -or $_ -eq 'package-lock.json'
	}

	if ($dependencyFilesChanged) {
		$shouldInstallDependencies = $true
		$installReason = 'dependency manifest files changed against upstream'
	}
}

if ($shouldInstallDependencies) {
	Write-Host ("Pre-push check: dependency reinstall required ({0})" -f $installReason) -ForegroundColor Cyan

	if (Test-Path 'package-lock.json') {
		npm.cmd ci
	} else {
		npm.cmd install
	}
} else {
	Write-Host 'Pre-push check: skipping dependency reinstall (no dependency changes detected)' -ForegroundColor DarkCyan
}

Write-Host 'Pre-push check: npm run build' -ForegroundColor Cyan
npm.cmd run build

Write-Host 'Pre-push checks passed.' -ForegroundColor Green