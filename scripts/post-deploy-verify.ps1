param(
  [string]$BaseUrl = "https://ashaac.com"
)

$ErrorActionPreference = "Stop"

function Invoke-RouteCheck {
  param(
    [string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
    return [pscustomobject]@{
      Url = $Url
      Status = [int]$response.StatusCode
      Ok = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
      Content = $response.Content
      Error = ""
    }
  }
  catch {
    $statusCode = 0
    try {
      if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
        $statusCode = [int]$_.Exception.Response.StatusCode
      }
    }
    catch {}

    return [pscustomobject]@{
      Url = $Url
      Status = $statusCode
      Ok = $false
      Content = ""
      Error = $_.Exception.Message
    }
  }
}

function Has-TagValue {
  param(
    [string]$Html,
    [string]$Pattern
  )

  return [regex]::IsMatch($Html, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
}

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss 'UTC'")
Write-Host "Post-Deploy Verification" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl"
Write-Host "Timestamp: $timestamp"
Write-Host ""

$coreRoutes = @("/", "/services", "/contact", "/diy-help-center", "/financing", "/reviews", "/valley")
$removedRoutes = @("/service-areas", "/service-areas/west-jordan")

$routeResults = @()
foreach ($path in $coreRoutes) {
  $routeResults += Invoke-RouteCheck -Url "$BaseUrl$path"
}

$removedResults = @()
foreach ($path in $removedRoutes) {
  $removedResults += Invoke-RouteCheck -Url "$BaseUrl$path"
}

$robotsResult = Invoke-RouteCheck -Url "$BaseUrl/robots.txt"
$sitemapResult = Invoke-RouteCheck -Url "$BaseUrl/sitemap.xml"
$homeResult = $routeResults | Where-Object { $_.Url -eq "$BaseUrl/" } | Select-Object -First 1

$homeHtml = [string]$homeResult.Content
$servicesHtml = [string](($routeResults | Where-Object { $_.Url -eq "$BaseUrl/services" } | Select-Object -First 1).Content)

$canonicalServices = ""
if ($servicesHtml -match '<link\s+rel="canonical"\s+href="([^"]+)"') {
  $canonicalServices = $Matches[1]
}

$metaDescriptionServices = Has-TagValue -Html $servicesHtml -Pattern '<meta\s+name="description"\s+content="[^"]+"'
$titleServices = Has-TagValue -Html $servicesHtml -Pattern '<title>.*?</title>'

$gtmJsRefs = ([regex]::Matches($homeHtml, 'googletagmanager\.com/gtm\.js', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
$gtagJsRefs = ([regex]::Matches($homeHtml, 'googletagmanager\.com/gtag/js', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
$gtmNsRefs = ([regex]::Matches($homeHtml, 'googletagmanager\.com/ns\.html', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count
$gaConfigRefs = ([regex]::Matches($homeHtml, "gtag\('config'", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)).Count

$sitemapContent = [string]$sitemapResult.Content
$sitemapHasServiceAreas = $sitemapContent -match '/service-areas'

Write-Host "=== Core Routes ===" -ForegroundColor Yellow
$routeResults | Select-Object Url, Status, Ok | Format-Table -AutoSize

Write-Host "=== Removed Routes (should be 404/410) ===" -ForegroundColor Yellow
$removedResults | Select-Object Url, Status, Ok | Format-Table -AutoSize

Write-Host "=== SEO Technical ===" -ForegroundColor Yellow
Write-Host "robots.txt status: $($robotsResult.Status)"
Write-Host "sitemap.xml status: $($sitemapResult.Status)"
Write-Host "sitemap contains /service-areas*: $sitemapHasServiceAreas"
Write-Host "services canonical: $canonicalServices"
Write-Host "services title present: $titleServices"
Write-Host "services description present: $metaDescriptionServices"

Write-Host "=== Analytics Loader Snapshot (Homepage HTML) ===" -ForegroundColor Yellow
Write-Host "gtm.js refs: $gtmJsRefs"
Write-Host "gtag.js refs: $gtagJsRefs"
Write-Host "gtm noscript iframe refs: $gtmNsRefs"
Write-Host "gtag('config') refs: $gaConfigRefs"

$hasBlocker = $false
if (($routeResults | Where-Object { -not $_.Ok }).Count -gt 0) { $hasBlocker = $true }
if ($robotsResult.Status -ne 200 -or $sitemapResult.Status -ne 200) { $hasBlocker = $true }
if (($removedResults | Where-Object { $_.Status -eq 200 }).Count -gt 0) { $hasBlocker = $true }
if ($sitemapHasServiceAreas) { $hasBlocker = $true }

Write-Host ""
if ($hasBlocker) {
  Write-Host "AUTOMATED DECISION: NO-GO" -ForegroundColor Red
}
else {
  Write-Host "AUTOMATED DECISION: GO (automated checks only)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Manual checks still required:" -ForegroundColor Cyan
Write-Host "1) GSC URL Inspection: /, /services, /valley"
Write-Host "2) GSC Sitemap resubmit + coverage recrawl"
Write-Host "3) GTM Preview + GA4 DebugView (single-fire check for call_click, financing_click, book_estimate_click, form_submit)"
Write-Host "4) PageSpeed Insights + Core Web Vitals trend review"
