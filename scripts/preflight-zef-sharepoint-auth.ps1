#Requires -Version 7.4
<#
.SYNOPSIS
    Validates Entra Application (Client) ID before SharePoint authentication.

.DESCRIPTION
    Read-only preflight check. Verifies Client ID presence, GUID format, and that
    the supplied value is not the ZEF Tenant ID. Does not connect to SharePoint.

.EXAMPLE
    $env:ENTRA_CLIENT_ID = "YOUR-ENTRA-APP-CLIENT-ID"
    .\scripts\preflight-zef-sharepoint-auth.ps1 -ClientId $env:ENTRA_CLIENT_ID

.EXAMPLE
    .\scripts\preflight-zef-sharepoint-auth.ps1 `
      -ClientId "YOUR-ENTRA-APP-CLIENT-ID" `
      -Tenant "607f8991-c6f3-4239-9bcf-31f33a5bf34d" `
      -AuthMode Interactive
#>
[CmdletBinding()]
param(
    [string]$ClientId,

    [string]$Tenant,

    [ValidateSet('Interactive', 'DeviceLogin')]
    [string]$AuthMode = 'Interactive'
)

$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1'
if (-not (Test-Path -LiteralPath $modulePath)) {
    throw "Provisioning module not found: $modulePath"
}

Import-Module $modulePath -Force

Write-Host 'ZEF SharePoint Authentication Preflight' -ForegroundColor White
Write-Host ''

try {
    $result = Assert-ZefEntraClientIdPreflight -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode
    Write-Host 'Preflight result: PASS' -ForegroundColor Green
    Write-Host ('  Application (Client) ID: {0}-****' -f $result.ClientId.Substring(0, 8)) -ForegroundColor DarkGray
    Write-Host ('  Client ID source: {0}' -f $result.ClientIdSource) -ForegroundColor DarkGray
    Write-Host ('  Tenant ID (reference): {0}' -f $result.TenantId) -ForegroundColor DarkGray
    Write-Host ('  Auth mode: {0}' -f $result.AuthMode) -ForegroundColor DarkGray
    Write-Host ''
    Write-Host 'No SharePoint authentication was attempted.' -ForegroundColor DarkGray
}
catch {
    Write-Host 'Preflight result: FAIL' -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
