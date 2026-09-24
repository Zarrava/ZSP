#Requires -Version 7.4
<#
.SYNOPSIS
    Read-only audit of ZEF SharePoint site chrome: header, navigation, theme, page layout.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^https://')]
    [string]$SiteUrl,

    [string]$ClientId,

    [string]$Tenant,

    [ValidateSet('Interactive', 'DeviceLogin')]
    [string]$AuthMode = 'Interactive',

    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1') -Force

if (-not $ClientId) { $ClientId = $env:ENTRA_CLIENT_ID }
if (-not $ClientId) { $ClientId = '265e3a54-3fe7-42fc-8434-7e4f9296b338' }

$audit = [ordered]@{
    auditedAt = (Get-Date).ToString('o')
    siteUrl   = $SiteUrl
    web       = @{}
    header    = @{}
    navigation = @{}
    theme     = @{}
    hub       = @{}
    pages     = @()
    spfx      = @{}
}

Write-Host 'ZEF Site Chrome Audit' -ForegroundColor White
Connect-ZefSharePointSite -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null

$web = Get-PnPWeb -Includes Title, Url, SiteLogoUrl, HeaderLayout, HeaderEmphasis, MegaMenuEnabled, QuickLaunchEnabled, HorizontalQuickLaunch, NavAudienceTargetingEnabled, WebTemplate
$audit.web = @{
    title            = $web.Title
    url              = $web.Url
    webTemplate      = $web.WebTemplate
    siteLogoUrl      = [string]$web.SiteLogoUrl
    isHubSite        = [bool]$web.IsHubSite
    hubSiteId        = [string]$web.HubSiteId
    quickLaunchEnabled = [bool]$web.QuickLaunchEnabled
}

Write-Host '=== WEB ===' -ForegroundColor Cyan
Write-Host ("Title: {0}" -f $web.Title)
Write-Host ("Template: {0}" -f $web.WebTemplate)
Write-Host ("Logo: {0}" -f $web.SiteLogoUrl)
Write-Host ("Hub site: {0}" -f $web.IsHubSite)

Write-Host ''
Write-Host '=== HEADER (modern) ===' -ForegroundColor Cyan
try {
    $header = Get-PnPWebHeader -ErrorAction Stop
    $audit.header = @{
        layout            = [string]$header.HeaderLayout
        emphasis          = [string]$header.HeaderEmphasis
        hideSiteTitle     = [bool]$header.HideSiteTitle
        logoAlignment     = [string]$header.LogoAlignment
        menuStyle         = [string]$header.MenuStyle
        navigationVisibility = [string]$header.NavigationVisibility
    }
    $header.PSObject.Properties | ForEach-Object {
        if ($_.Name -notmatch '^PS') {
            Write-Host ("{0}: {1}" -f $_.Name, $_.Value)
        }
    }
}
catch {
    Write-Host ("Get-PnPWebHeader failed: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    $audit.header.error = $_.Exception.Message
}

Write-Host ''
Write-Host '=== STRUCTURAL NAVIGATION ===' -ForegroundColor Cyan
try {
    $structural = Get-PnPStructuralNavigationCacheWebState -ErrorAction Stop
    $audit.navigation.structuralCache = $structural
    Write-Host ("Structural navigation cache enabled: {0}" -f $structural)
}
catch {
    Write-Host 'Structural navigation cache state unavailable.' -ForegroundColor DarkGray
}

try {
    $navNodes = Get-PnPNavigationNode -Location TopNavigationBar -ErrorAction Stop
    Write-Host 'Top navigation:'
    foreach ($node in $navNodes) {
        Write-Host ("  - {0} => {1}" -f $node.Title, $node.Url)
        $audit.navigation.top += @{
            title = $node.Title
            url   = [string]$node.Url
            id    = [int]$node.Id
        }
    }
}
catch {
    Write-Host ("Top navigation unavailable: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
}

try {
    $quickLaunch = Get-PnPNavigationNode -Location QuickLaunch -ErrorAction Stop
    Write-Host 'Quick launch:'
    foreach ($node in $quickLaunch) {
        Write-Host ("  - {0} => {1}" -f $node.Title, $node.Url)
        $audit.navigation.quickLaunch += @{
            title = $node.Title
            url   = [string]$node.Url
            id    = [int]$node.Id
        }
    }
}
catch {
    Write-Host ("Quick launch unavailable: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
}

Write-Host ''
Write-Host '=== THEME ===' -ForegroundColor Cyan
try {
    $theme = Get-PnPTheme -ErrorAction Stop
    if ($theme) {
        $audit.theme.name = $theme.Name
        Write-Host ("Current theme: {0}" -f $theme.Name)
    }
    else {
        Write-Host 'No custom theme applied (default SharePoint theme).'
    }
}
catch {
    Write-Host ("Theme query failed: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
}

Write-Host ''
Write-Host '=== SITE PAGES ===' -ForegroundColor Cyan
$pages = Get-PnPListItem -List 'Site Pages' -PageSize 50 -Fields 'Title', 'FileLeafRef', 'CanvasContent1', 'LayoutWebpartsContent', 'PromotedState'
foreach ($page in $pages) {
    $leaf = [string]$page.FieldValues.FileLeafRef
    if ($leaf -match 'OrganizationHome|Home\.aspx') {
        $canvas = [string]$page.FieldValues.CanvasContent1
        $hasZef = $canvas -match 'ZefDigitalWorkplace'
        Write-Host ("- {0} (ZEF web part: {1})" -f $leaf, $hasZef)
        $audit.pages += @{
            file          = $leaf
            title         = [string]$page.FieldValues.Title
            hasZefWebPart = $hasZef
        }
    }
}

Write-Host ''
Write-Host '=== INSTALLED SPFx APPS ===' -ForegroundColor Cyan
try {
    $apps = Get-PnPApp -Scope Site -ErrorAction Stop | Where-Object { $_.Title -match 'zef|digital workplace' }
    foreach ($app in $apps) {
        Write-Host ("- {0} v{1} deployed={2}" -f $app.Title, $app.AppCatalogVersion, $app.Deployed)
        $audit.spfx += @{
            title   = $app.Title
            version = [string]$app.AppCatalogVersion
            deployed = [bool]$app.Deployed
            id      = [string]$app.Id
        }
    }
}
catch {
    Write-Host ("Site app query failed: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
}

if (-not $OutputPath) {
    $dir = Join-Path $PSScriptRoot 'output'
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
    $OutputPath = Join-Path $dir 'zef-site-chrome-audit.json'
}

$audit | ConvertTo-Json -Depth 8 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Host ''
Write-Host ("Audit saved: {0}" -f $OutputPath) -ForegroundColor Green
Disconnect-PnPOnline
