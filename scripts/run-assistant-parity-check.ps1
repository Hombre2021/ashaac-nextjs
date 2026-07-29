param(
  [string]$PrimaryDataPath = (Join-Path $PSScriptRoot "..\data\assistant-store.json"),
  [string]$FallbackLeadsPath = "c:\Users\hombr\hvac-lead-generator\data\leads.json",
  [string]$FallbackThreadsPath = "c:\Users\hombr\hvac-lead-generator\data\text-threads.json",
  [int]$WindowDays = 7
)

$ErrorActionPreference = "Stop"

function Read-JsonFile([string]$Path) {
  if (-not (Test-Path $Path)) {
    return $null
  }

  return Get-Content -Raw -Path $Path | ConvertFrom-Json
}

function To-Array($Value) {
  if ($null -eq $Value) {
    return @()
  }
  return @($Value)
}

function Count-WithinWindow($Items, [string]$DateField, [datetime]$Cutoff) {
  $count = 0
  foreach ($item in $Items) {
    try {
      $dateValue = Get-Date $item.$DateField
      if ($dateValue -ge $Cutoff) {
        $count++
      }
    } catch {
      continue
    }
  }
  return $count
}

$cutoff = (Get-Date).AddDays(-1 * [Math]::Abs($WindowDays))

$primaryData = Read-JsonFile -Path $PrimaryDataPath
$fallbackLeadsData = Read-JsonFile -Path $FallbackLeadsPath
$fallbackThreadsData = Read-JsonFile -Path $FallbackThreadsPath

$primaryLeads = To-Array $primaryData.leads
$primaryActions = To-Array $primaryData.actions
$primaryThreads = To-Array $primaryData.threads

$fallbackLeads = To-Array $fallbackLeadsData.leads
$fallbackThreads = To-Array $fallbackThreadsData.threads

$primaryLeadsWindow = Count-WithinWindow -Items $primaryLeads -DateField "createdAt" -Cutoff $cutoff
$fallbackLeadsWindow = Count-WithinWindow -Items $fallbackLeads -DateField "createdAt" -Cutoff $cutoff

$primaryThreadsWindow = Count-WithinWindow -Items $primaryThreads -DateField "openedAt" -Cutoff $cutoff
$fallbackThreadsWindow = Count-WithinWindow -Items $fallbackThreads -DateField "openedAt" -Cutoff $cutoff

$primaryActionWindow = Count-WithinWindow -Items $primaryActions -DateField "createdAt" -Cutoff $cutoff

$leadDelta = $primaryLeadsWindow - $fallbackLeadsWindow
$threadDelta = $primaryThreadsWindow - $fallbackThreadsWindow

$status = "PASS"
if ([Math]::Abs($leadDelta) -gt 5 -or [Math]::Abs($threadDelta) -gt 5) {
  $status = "WARN"
}

$report = [PSCustomObject]@{
  generatedAt = (Get-Date).ToString("o")
  windowDays = $WindowDays
  status = $status
  primary = [PSCustomObject]@{
    leadsWithinWindow = $primaryLeadsWindow
    actionsWithinWindow = $primaryActionWindow
    threadsWithinWindow = $primaryThreadsWindow
    totalLeads = $primaryLeads.Count
    totalActions = $primaryActions.Count
    totalThreads = $primaryThreads.Count
  }
  fallback = [PSCustomObject]@{
    leadsWithinWindow = $fallbackLeadsWindow
    threadsWithinWindow = $fallbackThreadsWindow
    totalLeads = $fallbackLeads.Count
    totalThreads = $fallbackThreads.Count
  }
  deltas = [PSCustomObject]@{
    leads = $leadDelta
    threads = $threadDelta
  }
}

$reportDir = Join-Path $PSScriptRoot "..\data\parity-reports"
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$reportPath = Join-Path $reportDir "assistant-parity-$timestamp.json"
$report | ConvertTo-Json -Depth 8 | Set-Content -Path $reportPath

Write-Output "Assistant parity report written: $reportPath"
Write-Output "Status: $status"
Write-Output "Primary leads ($WindowDays d): $primaryLeadsWindow"
Write-Output "Fallback leads ($WindowDays d): $fallbackLeadsWindow"
Write-Output "Primary threads ($WindowDays d): $primaryThreadsWindow"
Write-Output "Fallback threads ($WindowDays d): $fallbackThreadsWindow"
