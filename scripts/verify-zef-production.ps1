#Requires -Version 7.4
<#
.SYNOPSIS
    Post-deployment verification for ZEF site: app catalog, customizer, page.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SiteUrl,

    [string]$AppCatalogUrl = 'https://zurfteempowercare.sharepoint.com/sites/appcatalog',

    [string]$ClientId,

    [string]$Tenant,

    [ValidateSet('Interactive', 'DeviceLogin')]
    [string]$AuthMode = 'Interactive'
)

$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1') -Force

if (-not $ClientId) { $ClientId = $env:ENTRA_CLIENT_ID }
if (-not $ClientId) { $ClientId = '265e3a54-3fe7-42fc-8434-7e4f9296b338' }

$componentId = 'f4e8c2a1-9b3d-4e7f-8c6a-5d2e1f0a9b8c'
$pageUrl = "$($SiteUrl.TrimEnd('/'))/SitePages/OrganizationHome.aspx"

Write-Host 'ZEF Production Verification' -ForegroundColor White
Write-Host ''

Write-Host '=== APP CATALOG ===' -ForegroundColor Cyan
Connect-ZefSharePointSite -SiteUrl $AppCatalogUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null
$tenantApps = Get-PnPApp -Scope Tenant | Where-Object {
    $_.Title -match 'zef-digital-workplace' -or $_.ProductId -eq '085ac811-6b60-4b52-ab2d-a1d706b87a06'
}
foreach ($app in $tenantApps) {
    Write-Host ("App: {0}" -f $app.Title)
    Write-Host ("  Version: {0}" -f $app.AppCatalogVersion)
    Write-Host ("  Deployed: {0}" -f $app.Deployed)
    Write-Host ("  ProductId: {0}" -f $app.ProductId)
}
Disconnect-PnPOnline

Write-Host ''
Write-Host '=== SITE: CUSTOMIZER + PAGE ===' -ForegroundColor Cyan
Connect-ZefSharePointSite -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null

$customActions = @(Get-PnPCustomAction -Scope Web -ErrorAction SilentlyContinue | Where-Object {
    $_.ClientSideComponentId -eq $componentId -or $_.Name -match 'ZEFSiteNavigation'
})
Write-Host ("Application Customizer registrations: {0}" -f $customActions.Count)
foreach ($ca in $customActions) {
    Write-Host ("  - Name: {0}" -f $ca.Name)
    Write-Host ("    ComponentId: {0}" -f $ca.ClientSideComponentId)
    Write-Host ("    Location: {0}" -f $ca.Location)
}

try {
    $header = Get-PnPWebHeader -ErrorAction Stop
    Write-Host ''
    Write-Host 'Site header config:'
    Write-Host ("  Layout: {0}" -f $header.HeaderLayout)
    Write-Host ("  HideTitleInHeader: {0}" -f $header.HideTitleInHeader)
}
catch {
    Write-Host "Site header query skipped: $($_.Exception.Message)" -ForegroundColor Yellow
}

$page = Get-PnPPage -Identity 'OrganizationHome.aspx' -ErrorAction Stop
Write-Host ''
Write-Host ("Page: {0}" -f $page.Title)
Write-Host ("Layout: {0}" -f $page.LayoutType)
Write-Host ("Published: {0}" -f $page.Published)

$controls = @($page.Controls | ForEach-Object { $_.Properties.Title })
Write-Host ("Web parts on page: {0}" -f ($controls -join ', '))

Disconnect-PnPOnline

Write-Host ''
Write-Host "Published page URL: $pageUrl" -ForegroundColor Green
Write-Host 'Visual/console verification requires browser in published view mode.' -ForegroundColor DarkGray
