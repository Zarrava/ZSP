#Requires -Version 7.4
<#
.SYNOPSIS
    Read-only environment check for ZEF SharePoint provisioning tooling.

.DESCRIPTION
    Reports PowerShell version, PnP.PowerShell version, Client ID presence/format,
    and target SharePoint URL. Does not authenticate or modify SharePoint.

.EXAMPLE
    .\scripts\diagnose-zef-sharepoint.ps1 `
      -SiteUrl "https://TENANT.sharepoint.com/sites/ZEF" `
      -ClientId "YOUR-ENTRA-APP-CLIENT-ID"

.EXAMPLE
    $env:ENTRA_CLIENT_ID = "YOUR-ENTRA-APP-CLIENT-ID"
    .\scripts\diagnose-zef-sharepoint.ps1 `
      -SiteUrl "https://TENANT.sharepoint.com/sites/ZEF"
#>
[CmdletBinding()]
param(
    [ValidatePattern('^https://')]
    [string]$SiteUrl,

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

Test-ZefProvisioningEnvironment -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode
