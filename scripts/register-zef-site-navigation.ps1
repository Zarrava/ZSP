#Requires -Version 7.4
<#
.SYNOPSIS
    Registers the ZEF Site Navigation Application Customizer on a SharePoint site.

.DESCRIPTION
    Requires the zef-digital-workplace solution (1.0.7.0+) to be deployed to the
    tenant App Catalog and installed on the target site.

.EXAMPLE
    .\scripts\register-zef-site-navigation.ps1 `
      -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
      -ClientId $env:ENTRA_CLIENT_ID
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^https://')]
    [string]$SiteUrl,

    [string]$ClientId,

    [string]$Tenant,

    [ValidateSet('Interactive', 'DeviceLogin')]
    [string]$AuthMode = 'Interactive',

    [switch]$Remove
)

$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1') -Force

if (-not $ClientId) { $ClientId = $env:ENTRA_CLIENT_ID }
if (-not $ClientId) { $ClientId = '265e3a54-3fe7-42fc-8434-7e4f9296b338' }

$componentId = 'f4e8c2a1-9b3d-4e7f-8c6a-5d2e1f0a9b8c'
$customActionName = 'ZEFSiteNavigationApplicationCustomizer'

Write-Host 'ZEF Site Navigation — Application Customizer Registration' -ForegroundColor White
Write-Host "Site URL: $SiteUrl"
Write-Host "Component ID: $componentId"
Write-Host ''

Connect-ZefSharePointSite -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null

$existing = Get-PnPCustomAction -Scope Web -ErrorAction SilentlyContinue |
    Where-Object { $_.ClientSideComponentId -eq $componentId -or $_.Name -eq $customActionName }

if ($Remove) {
    foreach ($action in $existing) {
        if ($PSCmdlet.ShouldProcess($action.Name, 'Remove custom action')) {
            Remove-PnPCustomAction -Identity $action.Id -Scope Web -Force
            Write-Host "Removed custom action: $($action.Name)" -ForegroundColor Green
        }
    }
    Disconnect-PnPOnline
    return
}

if ($existing) {
    Write-Host 'Application Customizer is already registered on this site.' -ForegroundColor Green
    $existing | ForEach-Object { Write-Host ("  - {0} ({1})" -f $_.Name, $_.ClientSideComponentId) }
    Disconnect-PnPOnline
    return
}

if ($PSCmdlet.ShouldProcess($SiteUrl, 'Register ZEF Site Navigation Application Customizer')) {
    Add-PnPCustomAction `
        -Name $customActionName `
        -Title 'ZEF Site Navigation' `
        -Location 'ClientSideExtension.ApplicationCustomizer' `
        -ClientSideComponentId $componentId `
        -ClientSideComponentProperties '{}' `
        -Scope Web | Out-Null

    Write-Host 'Registered ZEF Site Navigation Application Customizer.' -ForegroundColor Green
}

Disconnect-PnPOnline
