#Requires -Version 7.4
<#
.SYNOPSIS
    Applies supported SharePoint site chrome settings for the ZEF Digital Workplace.

.DESCRIPTION
    - Sets modern header to Minimal and hides duplicate site title bar
    - Ensures Digital Workplace navigation entry exists (OrganizationHome.aspx)
    - Does NOT modify Microsoft 365 global suite bar (unsupported)
    - Does NOT deploy SPFx packages

.PARAMETER DryRun
    Report planned SharePoint configuration changes without applying them.

.EXAMPLE
    .\scripts\apply-zef-site-chrome.ps1 `
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

    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1') -Force

if (-not $ClientId) { $ClientId = $env:ENTRA_CLIENT_ID }
if (-not $ClientId) { $ClientId = '265e3a54-3fe7-42fc-8434-7e4f9296b338' }

$digitalWorkplaceTitle = 'Digital Workplace'

Write-Host 'ZEF Site Chrome — Supported Configuration Apply' -ForegroundColor White
Write-Host "Site URL: $SiteUrl"
if ($DryRun) { Write-Host 'Mode: DRY RUN' -ForegroundColor Yellow }
Write-Host ''

Connect-ZefSharePointSite -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null

$web = Get-PnPWeb -Includes ServerRelativeUrl
$digitalWorkplaceUrl = "$($web.ServerRelativeUrl)/SitePages/OrganizationHome.aspx"

Write-Host '=== CURRENT HEADER ===' -ForegroundColor Cyan
$headerBefore = Get-PnPWebHeader
Write-Host ("Layout: {0}" -f $headerBefore.HeaderLayout)
Write-Host ("Emphasis: {0}" -f $headerBefore.HeaderEmphasis)
Write-Host ("HideTitleInHeader: {0}" -f $headerBefore.HideTitleInHeader)

Write-Host ''
Write-Host '=== PLANNED HEADER CHANGE ===' -ForegroundColor Cyan
Write-Host 'Set HeaderLayout = Minimal (supported modern header reduction)'
Write-Host 'Set HideTitleInHeader = True (avoid duplicate site title above ZEF navigation extension)'

if (-not $DryRun -and $PSCmdlet.ShouldProcess($SiteUrl, 'Apply minimal SharePoint header settings')) {
    Set-PnPWebHeader -HeaderLayout Minimal -HideSiteTitle -ErrorAction Stop
    Write-Host 'Applied minimal header settings.' -ForegroundColor Green
}

Write-Host ''
Write-Host '=== NAVIGATION ===' -ForegroundColor Cyan
$nodes = @(Get-PnPNavigationNode -Location QuickLaunch)
$nodes | ForEach-Object { Write-Host ("  - {0} => {1}" -f $_.Title, $_.Url) }

$existing = $nodes | Where-Object {
    $_.Title -eq $digitalWorkplaceTitle -or
    ($_.Url -and $_.Url -match 'OrganizationHome\.aspx')
} | Select-Object -First 1

if ($existing) {
    Write-Host "Digital Workplace navigation entry already exists: $($existing.Title)" -ForegroundColor Green
}
else {
    Write-Host "Planned: Add '$digitalWorkplaceTitle' => $digitalWorkplaceUrl"
    if (-not $DryRun -and $PSCmdlet.ShouldProcess($SiteUrl, 'Add Digital Workplace navigation node')) {
        Add-PnPNavigationNode -Location QuickLaunch -Title $digitalWorkplaceTitle -Url $digitalWorkplaceUrl -ErrorAction Stop | Out-Null
        Write-Host 'Added Digital Workplace navigation entry.' -ForegroundColor Green
    }
}

Write-Host ''
Write-Host '=== POST-CHANGE HEADER ===' -ForegroundColor Cyan
$headerAfter = Get-PnPWebHeader
Write-Host ("Layout: {0}" -f $headerAfter.HeaderLayout)
Write-Host ("HideTitleInHeader: {0}" -f $headerAfter.HideTitleInHeader)

Write-Host ''
Write-Host 'NOTE: Microsoft 365 global suite bar remains visible by design (no supported removal).' -ForegroundColor DarkGray
Write-Host 'Register the ZEF Site Navigation Application Customizer after deploying package 1.0.7.0.' -ForegroundColor DarkGray
Write-Host '  .\scripts\register-zef-site-navigation.ps1 -SiteUrl "' -NoNewline -ForegroundColor DarkGray
Write-Host "$SiteUrl`"" -ForegroundColor DarkGray

Disconnect-PnPOnline
