#Requires -Version 7.4
<#
.SYNOPSIS
    Provisions ZEF Digital Workplace SharePoint lists, columns, and optional seed data.

.EXAMPLE
    .\scripts\provision-zef-sharepoint.ps1 `
      -SiteUrl "https://TENANT.sharepoint.com/sites/ZEF" `
      -ClientId "YOUR-ENTRA-APP-CLIENT-ID" `
      -DryRun

.EXAMPLE
    .\scripts\provision-zef-sharepoint.ps1 `
      -SiteUrl "https://TENANT.sharepoint.com/sites/ZEF" `
      -ClientId "YOUR-ENTRA-APP-CLIENT-ID" `
      -SeedData
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^https://')]
    [string]$SiteUrl,

    [switch]$SeedData,
    [switch]$DryRun,
    [switch]$AllowPlaceholders,
    [switch]$ConfirmDrafts,

    [string]$SeedDataPath,

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

Write-Host 'ZEF Digital Workplace — SharePoint Provisioning' -ForegroundColor White
Write-Host "Site URL: $SiteUrl" -ForegroundColor White
Write-Host "Auth mode: $AuthMode" -ForegroundColor White
if ($DryRun) {
    Write-Host 'Mode: DRY RUN (no changes will be made)' -ForegroundColor Yellow
}
Write-Host ''

try {
    Assert-ZefEntraClientIdPreflight -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null

    Invoke-ZefSharePointProvisioning `
        -SiteUrl $SiteUrl `
        -SeedData:$SeedData `
        -DryRun:$DryRun `
        -AllowPlaceholders:$AllowPlaceholders `
        -ConfirmDrafts:$ConfirmDrafts `
        -SeedDataPath $SeedDataPath `
        -ClientId $ClientId `
        -Tenant $Tenant `
        -AuthMode $AuthMode

    Write-Host ''
    if ($DryRun) {
        Write-Host 'Dry run completed. No changes were made.' -ForegroundColor Yellow
    }
    else {
        Write-Host 'Provisioning completed successfully.' -ForegroundColor Green
    }
}
catch {
    Write-Host ''
    Write-Host "Provisioning failed: $($_.Exception.Message)" -ForegroundColor Red
    throw
}
