#Requires -Version 7.4
<#
.SYNOPSIS
    Validates ZEF Digital Workplace SharePoint list and column configuration.

.EXAMPLE
    .\scripts\validate-zef-sharepoint.ps1 `
      -SiteUrl "https://TENANT.sharepoint.com/sites/ZEF" `
      -ClientId "YOUR-ENTRA-APP-CLIENT-ID"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^https://')]
    [string]$SiteUrl,

    [string]$ClientId,

    [string]$Tenant,

    [ValidateSet('Interactive', 'DeviceLogin')]
    [string]$AuthMode = 'Interactive'
)

$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1'
Import-Module $modulePath -Force

Write-Host 'ZEF Digital Workplace — SharePoint Validation' -ForegroundColor White
Write-Host "Site URL: $SiteUrl" -ForegroundColor White
Write-Host ''

try {
    Assert-ZefEntraClientIdPreflight -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null
    $passed = Invoke-ZefSharePointValidation -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode
    if (-not $passed) {
        exit 1
    }
}
catch {
    Write-Host "Validation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
