#Requires -Version 7.4
<#
.SYNOPSIS
    Exports ZEF Digital Workplace SharePoint list structure to JSON (no list item data).

.EXAMPLE
    .\scripts\export-zef-sharepoint-config.ps1 `
      -SiteUrl "https://TENANT.sharepoint.com/sites/ZEF" `
      -ClientId "YOUR-ENTRA-APP-CLIENT-ID" `
      -OutputPath ".\scripts\output\zef-sharepoint-config.json"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^https://')]
    [string]$SiteUrl,

    [string]$OutputPath,

    [string]$ClientId,

    [string]$Tenant,

    [ValidateSet('Interactive', 'DeviceLogin')]
    [string]$AuthMode = 'Interactive'
)

$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1'
Import-Module $modulePath -Force

Write-Host 'ZEF Digital Workplace — SharePoint Config Export' -ForegroundColor White
Write-Host "Site URL: $SiteUrl" -ForegroundColor White
Write-Host 'Note: This export contains list/column structure only — not list item data.' -ForegroundColor DarkGray
Write-Host ''

try {
    Assert-ZefEntraClientIdPreflight -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null
    Export-ZefSharePointConfig -SiteUrl $SiteUrl -OutputPath $OutputPath -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null
}
catch {
    Write-Host "Export failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
