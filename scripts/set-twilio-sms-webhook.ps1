param(
  [string]$IncomingUrl = "https://ashaac.com/api/webhooks/twilio/sms",
  [string]$VoiceUrl = "https://ashaac.com/api/assistant/phone",
  [switch]$UseLocalhost,
  [string]$LocalhostUrl = "http://localhost:3000/api/webhooks/twilio/sms",
  [string]$LocalhostVoiceUrl = "http://localhost:3000/api/assistant/phone",
  [switch]$SmsOnly,
  [switch]$VoiceOnly,
  [switch]$AllIncomingNumbers,
  [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

function Get-EnvVar([string]$Name) {
  $value = [Environment]::GetEnvironmentVariable($Name)
  if (-not [string]::IsNullOrWhiteSpace($value)) {
    return $value.Trim()
  }
  return ""
}

function Normalize-E164([string]$Value) {
  $raw = [string]($Value ?? "")
  $raw = $raw.Trim()
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return ""
  }

  if ($raw -match '^\+\d{10,15}$') {
    return $raw
  }

  $digits = ($raw -replace '[^0-9]', '')
  if ([string]::IsNullOrWhiteSpace($digits)) {
    return ""
  }

  if ($digits.Length -eq 10) {
    return "+1$digits"
  }

  if ($digits.Length -eq 11 -and $digits.StartsWith("1")) {
    return "+$digits"
  }

  if ($digits.Length -ge 10 -and $digits.Length -le 15) {
    return "+$digits"
  }

  return ""
}

function Get-ConfiguredTwilioNumbers {
  $values = New-Object System.Collections.Generic.List[string]

  $multi = Get-EnvVar "TWILIO_PHONE_NUMBERS"
  if (-not [string]::IsNullOrWhiteSpace($multi)) {
    foreach ($entry in ($multi -split '[,;\s]+')) {
      if (-not [string]::IsNullOrWhiteSpace($entry)) {
        $values.Add($entry.Trim())
      }
    }
  }

  $singleKeys = @(
    "TWILIO_FROM_NUMBER",
    "TWILIO_FROM_SMS",
    "TWILIO_FROM_CALL",
    "TWILIO_LINE_1",
    "TWILIO_LINE_2"
  )

  foreach ($key in $singleKeys) {
    $value = Get-EnvVar $key
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      $values.Add($value)
    }
  }

  $normalized = @{}
  foreach ($candidate in $values) {
    $number = Normalize-E164 $candidate
    if (-not [string]::IsNullOrWhiteSpace($number)) {
      $normalized[$number] = $true
    }
  }

  return $normalized.Keys | Sort-Object
}

function Get-AllIncomingTwilioNumbers([string]$AccountSid, [hashtable]$Headers) {
  $list = New-Object System.Collections.Generic.List[string]
  $pageToken = ""

  while ($true) {
    $uri = if ([string]::IsNullOrWhiteSpace($pageToken)) {
      "https://api.twilio.com/2010-04-01/Accounts/$AccountSid/IncomingPhoneNumbers.json?PageSize=100"
    } else {
      "https://api.twilio.com/2010-04-01/Accounts/$AccountSid/IncomingPhoneNumbers.json?PageSize=100&PageToken=$([System.Uri]::EscapeDataString($pageToken))"
    }

    $response = Invoke-RestMethod -Method Get -Uri $uri -Headers $Headers
    foreach ($entry in ($response.incoming_phone_numbers | Where-Object { $_ })) {
      $number = Normalize-E164 ([string]$entry.phone_number)
      if (-not [string]::IsNullOrWhiteSpace($number)) {
        $list.Add($number)
      }
    }

    $nextPage = [string]($response.next_page_uri ?? "")
    if ([string]::IsNullOrWhiteSpace($nextPage)) {
      break
    }

    if ($nextPage -match "[?&]PageToken=([^&]+)") {
      $pageToken = [System.Uri]::UnescapeDataString($matches[1])
    } else {
      break
    }
  }

  return $list | Sort-Object -Unique
}

function Load-DotEnv([string]$Path) {
  if (-not (Test-Path $Path)) {
    return
  }

  Get-Content -Path $Path | ForEach-Object {
    $line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
      return
    }

    $parts = $line.Split("=", 2)
    if ($parts.Count -ne 2) {
      return
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"')

    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
      [Environment]::SetEnvironmentVariable($name, $value)
    }
  }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$dotenvPath = Join-Path $projectRoot ".env.local"
Load-DotEnv -Path $dotenvPath

$accountSid = Get-EnvVar "TWILIO_ACCOUNT_SID"
$authToken = Get-EnvVar "TWILIO_AUTH_TOKEN"
$phoneNumbers = @()

if ([string]::IsNullOrWhiteSpace($accountSid) -or [string]::IsNullOrWhiteSpace($authToken)) {
  throw "Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN."
}

if ($SmsOnly -and $VoiceOnly) {
  throw "Choose only one mode: -SmsOnly or -VoiceOnly."
}

$effectiveSmsUrl = if ($UseLocalhost) { $LocalhostUrl } else { $IncomingUrl }
$effectiveVoiceUrl = if ($UseLocalhost) { $LocalhostVoiceUrl } else { $VoiceUrl }

$shouldUpdateSms = -not $VoiceOnly
$shouldUpdateVoice = -not $SmsOnly

$credentialBytes = [Text.Encoding]::ASCII.GetBytes("${accountSid}:${authToken}")
$basicAuth = [Convert]::ToBase64String($credentialBytes)
$headers = @{ Authorization = "Basic $basicAuth" }

if ($AllIncomingNumbers) {
  $phoneNumbers = @(Get-AllIncomingTwilioNumbers -AccountSid $accountSid -Headers $headers)
} else {
  $phoneNumbers = @(Get-ConfiguredTwilioNumbers)
}

if (-not $phoneNumbers -or $phoneNumbers.Count -eq 0) {
  if ($AllIncomingNumbers) {
    throw "No incoming Twilio numbers found on the account."
  }
  throw "No Twilio phone numbers configured. Set TWILIO_PHONE_NUMBERS or TWILIO_FROM_* values, or run with -AllIncomingNumbers."
}

Write-Output "Updating Twilio webhooks for $($phoneNumbers.Count) phone number(s)..."

foreach ($phoneNumber in $phoneNumbers) {
  $encodedPhone = [System.Uri]::EscapeDataString($phoneNumber)
  $listUri = "https://api.twilio.com/2010-04-01/Accounts/$accountSid/IncomingPhoneNumbers.json?PhoneNumber=$encodedPhone"

  $numbers = Invoke-RestMethod -Method Get -Uri $listUri -Headers $headers
  if (-not $numbers.incoming_phone_numbers -or $numbers.incoming_phone_numbers.Count -eq 0) {
    Write-Warning "No incoming Twilio number found matching $phoneNumber"
    continue
  }

  $numberSid = $numbers.incoming_phone_numbers[0].sid
  $updateUri = "https://api.twilio.com/2010-04-01/Accounts/$accountSid/IncomingPhoneNumbers/$numberSid.json"

  $body = @{}
  if ($shouldUpdateSms) {
    $body.SmsUrl = $effectiveSmsUrl
    $body.SmsMethod = "POST"
  }

  if ($shouldUpdateVoice) {
    $body.VoiceUrl = $effectiveVoiceUrl
    $body.VoiceMethod = "POST"
  }

  if ($body.Keys.Count -eq 0) {
    Write-Warning "Nothing to update for $phoneNumber because no webhook mode was selected."
    continue
  }

  if ($WhatIf) {
    Write-Output "[WhatIf] Number: $phoneNumber"
    Write-Output "[WhatIf] NumberSid: $numberSid"
    if ($shouldUpdateSms) {
      Write-Output "[WhatIf] SmsUrl: $effectiveSmsUrl"
    }
    if ($shouldUpdateVoice) {
      Write-Output "[WhatIf] VoiceUrl: $effectiveVoiceUrl"
    }
    continue
  }

  Invoke-RestMethod -Method Post -Uri $updateUri -Headers $headers -Body $body | Out-Null
  Write-Output "Twilio webhook updated for $phoneNumber"
  Write-Output "NumberSid: $numberSid"
  if ($shouldUpdateSms) {
    Write-Output "SmsUrl: $effectiveSmsUrl"
  }
  if ($shouldUpdateVoice) {
    Write-Output "VoiceUrl: $effectiveVoiceUrl"
  }
}
