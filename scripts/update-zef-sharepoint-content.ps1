#Requires -Version 7.4
<#
.SYNOPSIS
    Safely updates approved ZEF Digital Workplace SharePoint list content (upsert only).

.DESCRIPTION
    Updates existing ZEF Departments, ZEF Resources, and ZEF Announcements content.
    Does NOT create lists/columns, delete items, or run full reprovisioning.

    Dry run reads SharePoint list items and reports [UPDATE]/[ADD]/[SKIP]/[WARNING] only.
    Dry run never calls Add-PnPListItem, Set-PnPListItem, Remove-PnPListItem, New-PnPList, or Add-PnPField.

.EXAMPLE
    $env:ENTRA_CLIENT_ID = 'YOUR-ENTRA-APP-CLIENT-ID'
    .\scripts\update-zef-sharepoint-content.ps1 `
      -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
      -DryRun `
      -AuthMode DeviceLogin

.EXAMPLE
    .\scripts\update-zef-sharepoint-content.ps1 `
      -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
      -ValidateOnly `
      -AuthMode DeviceLogin
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^https://')]
    [string]$SiteUrl,

    [switch]$DryRun,

    [switch]$ValidateOnly,

    [switch]$StopOnWarning,

    [string]$SeedDataPath,

    [string]$ClientId,

    [string]$Tenant,

    [ValidateSet('Interactive', 'DeviceLogin')]
    [string]$AuthMode = 'Interactive'
)

$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'lib\ZefSharePointContentUpdate.psm1'
if (-not (Test-Path -LiteralPath $modulePath)) {
    throw "Content update module not found: $modulePath"
}

Import-Module $modulePath -Force

Write-Host 'ZEF Digital Workplace — SharePoint Content Update' -ForegroundColor White
Write-Host "Site URL: $SiteUrl" -ForegroundColor White
Write-Host "Auth mode: $AuthMode" -ForegroundColor White

if ($ValidateOnly) {
    Write-Host 'Mode: VALIDATE ONLY (read-only content check)' -ForegroundColor Cyan
}
elseif ($DryRun) {
    Write-Host 'Mode: DRY RUN (read-only; no SharePoint writes)' -ForegroundColor Yellow
}
else {
    Write-Host 'Mode: APPLY (will update SharePoint list content)' -ForegroundColor Magenta
}

Write-Host ''

try {
    Assert-ZefEntraClientIdPreflight -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null

    $result = Invoke-ZefSharePointContentUpdate `
        -SiteUrl $SiteUrl `
        -DryRun:$DryRun `
        -ValidateOnly:$ValidateOnly `
        -StopOnWarning:$StopOnWarning `
        -SeedDataPath $SeedDataPath `
        -ClientId $ClientId `
        -Tenant $Tenant `
        -AuthMode $AuthMode

    Write-Host ''
    if ($ValidateOnly) {
        if ($result) {
            Write-Host 'Validation completed.' -ForegroundColor Green
            exit 0
        }

        Write-Host 'Validation completed with failures.' -ForegroundColor Red
        exit 1
    }

    if ($DryRun) {
        Write-Host 'Dry run completed. No changes were made.' -ForegroundColor Yellow
    }
    else {
        Write-Host 'Content update completed successfully.' -ForegroundColor Green
    }
}
catch {
    Write-Host ''
    Write-Host "Content update failed: $($_.Exception.Message)" -ForegroundColor Red
    throw
}
