#Requires -Version 7.4
<#
.SYNOPSIS
    Deploys the ZEF Digital Workplace .sppkg to the tenant App Catalog.
#>
[CmdletBinding()]
param(
    [string]$AppCatalogUrl = 'https://zurfteempowercare.sharepoint.com/sites/appcatalog',

    [string]$PackagePath = (Join-Path $PSScriptRoot '..\sharepoint\solution\zef-digital-workplace.sppkg'),

    [string]$ClientId,

    [string]$Tenant,

    [ValidateSet('Interactive', 'DeviceLogin')]
    [string]$AuthMode = 'Interactive'
)

$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1') -Force

if (-not $ClientId) { $ClientId = $env:ENTRA_CLIENT_ID }
if (-not $ClientId) { $ClientId = '265e3a54-3fe7-42fc-8434-7e4f9296b338' }

if (-not (Test-Path -LiteralPath $PackagePath)) {
    throw "Package not found: $PackagePath"
}

Write-Host 'ZEF Digital Workplace — App Catalog Deployment' -ForegroundColor White
Write-Host "App Catalog: $AppCatalogUrl"
Write-Host "Package: $PackagePath"
Write-Host ''

Connect-ZefSharePointSite -SiteUrl $AppCatalogUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null

Write-Host 'Uploading and publishing package (Overwrite)...' -ForegroundColor Cyan
$app = Add-PnPApp -Path $PackagePath -Overwrite -Publish -Scope Tenant -ErrorAction Stop

Write-Host ''
Write-Host '=== DEPLOYED APP ===' -ForegroundColor Cyan
Write-Host ("Title: {0}" -f $app.Title)
Write-Host ("AppId: {0}" -f $app.Id)
Write-Host ("Version: {0}" -f $app.AppCatalogVersion)
Write-Host ("Deployed: {0}" -f $app.Deployed)

$allApps = Get-PnPApp -Scope Tenant | Where-Object { $_.Title -match 'zef-digital-workplace' -or $_.Id -eq '085ac811-6b60-4b52-ab2d-a1d706b87a06' }
Write-Host ''
Write-Host '=== TENANT APP CATALOG ENTRY ===' -ForegroundColor Cyan
foreach ($entry in $allApps) {
    Write-Host ("- {0} | Version {1} | Deployed={2}" -f $entry.Title, $entry.AppCatalogVersion, $entry.Deployed)
}

$result = [ordered]@{
    deployedAt = (Get-Date).ToString('o')
    appCatalogUrl = $AppCatalogUrl
    packagePath = $PackagePath
    title = $app.Title
    appId = [string]$app.Id
    version = [string]$app.AppCatalogVersion
    deployed = [bool]$app.Deployed
}

$outDir = Join-Path $PSScriptRoot 'output'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
$resultPath = Join-Path $outDir 'zef-app-catalog-deploy.json'
$result | ConvertTo-Json | Set-Content -Path $resultPath -Encoding UTF8
Write-Host ''
Write-Host ("Deployment record: {0}" -f $resultPath) -ForegroundColor Green

Disconnect-PnPOnline
