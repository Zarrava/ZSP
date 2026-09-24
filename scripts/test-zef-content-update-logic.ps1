#Requires -Version 7.4
<#
.SYNOPSIS
    Logic tests for ZEF SharePoint content update (no SharePoint connection).
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$provisioningModulePath = Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1'
$modulePath = Join-Path $PSScriptRoot 'lib\ZefSharePointContentUpdate.psm1'
$seedPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'docs\ZEF-SHAREPOINT-DATA-SEED.md'

Import-Module $provisioningModulePath -Force
Import-Module $modulePath -Force
$seed = Read-ZefSeedDataFromMarkdown -MarkdownPath $seedPath

$failures = 0

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if ($Condition) { Write-Host "  [PASS] $Message" -ForegroundColor Green }
    else { Write-Host "  [FAIL] $Message" -ForegroundColor Red; $script:failures++ }
}

Write-Host 'ZEF SharePoint Content Update Logic Tests' -ForegroundColor White
Write-Host ''

Write-Host 'Seed structure:' -ForegroundColor Cyan
Assert-True (@($seed.Departments).Count -eq 9) 'Seed defines 9 departments'
Assert-True (@($seed.Announcements | Where-Object { -not (Test-ZefDraftAnnouncement -Announcement $_) }).Count -eq 6) 'Seed defines 6 production announcements'
Assert-True (@($seed.Resources | Where-Object { Test-ZefValidHttpsUrl -Url $_.Link }).Count -eq 3) 'Seed defines 3 confirmed resources'

Write-Host ''
Write-Host 'Department change detection:' -ForegroundColor Cyan
$hrSeed = $seed.Departments | Where-Object { $_.Title -eq 'Human Resources' } | Select-Object -First 1
$hrExisting = [pscustomobject]@{
    Title = 'Human Resources'
    Description = 'Old description'
    Icon = 'Org'
    SharePointSiteUrl = $null
    TeamsUrl = $null
}
$hrChanges = Get-ZefDepartmentContentChanges -SeedRow $hrSeed -ExistingItem $hrExisting
Assert-True ($hrChanges.Contains('Description')) 'Department description update detected'
Assert-True ($hrChanges.Contains('Icon')) 'Department icon update detected'
Assert-True (-not $hrChanges.Contains('SharePointSiteUrl')) 'Blank seed does not overwrite SharePointSiteUrl'

$hrExistingWithUrl = [pscustomobject]@{
    Title = 'Human Resources'
    Description = $hrSeed.Description
    Icon = $hrSeed.Icon
    SharePointSiteUrl = 'https://zurfteempowercare.sharepoint.com/sites/ZEF'
    TeamsUrl = $null
}
$preserveChanges = Get-ZefDepartmentContentChanges -SeedRow $hrSeed -ExistingItem $hrExistingWithUrl
Assert-True ($preserveChanges.Count -eq 0) 'Existing verified department URL is preserved when seed URL is blank'

Write-Host ''
Write-Host 'Resource add/skip detection:' -ForegroundColor Cyan
$m365Seed = $seed.Resources | Where-Object { $_.Title -eq 'Microsoft 365 help' } | Select-Object -First 1
$m365Values = Get-ZefResourceSeedValues -SeedRow $m365Seed
Assert-True ($null -ne $m365Values) 'Confirmed resource values are built'
Assert-True (Test-ZefValidHttpsUrl -Url $m365Seed.Link) 'Microsoft 365 help URL is valid https'

Write-Host ''
Write-Host 'Announcement change detection:' -ForegroundColor Cyan
$welcomeSeed = $seed.Announcements | Where-Object { $_.Title -eq 'Welcome to the ZEF Digital Workplace' } | Select-Object -First 1
$welcomeExisting = [pscustomobject]@{
    Title = $welcomeSeed.Title
    Body = 'Old body'
    Category = 'Organization'
    PublishedDate = '2026-09-19T08:00:00Z'
    Priority = 'Normal'
    Link = $null
    ExpiryDate = $null
}
$welcomeChanges = Get-ZefAnnouncementContentChanges -SeedRow $welcomeSeed -ExistingItem $welcomeExisting
Assert-True ($welcomeChanges.Contains('Body')) 'Announcement body update detected'
Assert-True ($welcomeChanges.Contains('Category')) 'Announcement category update detected'
Assert-True ($welcomeChanges.Contains('Link')) 'Approved announcement link update detected'

$opsSeed = $seed.Announcements | Where-Object { $_.Title -eq 'SharePoint lists now being configured' } | Select-Object -First 1
$opsExisting = [pscustomobject]@{
    Title = $opsSeed.Title
    Body = $opsSeed.Body
    Category = $opsSeed.Category
    PublishedDate = '2026-09-19T08:00:00Z'
    Priority = $opsSeed.Priority
    Link = '[INSERT ACTUAL ZEF URL]'
    ExpiryDate = $null
}
$opsChanges = Get-ZefAnnouncementContentChanges -SeedRow $opsSeed -ExistingItem $opsExisting
Assert-True ($opsChanges.Contains('ExpiryDate')) 'Temporary announcement expiry is applied'
Assert-True ($opsChanges.Contains('Link')) 'Placeholder announcement link is cleared'

Write-Host ''
Write-Host 'URL safety:' -ForegroundColor Cyan
Assert-True (-not (Test-ZefValidHttpsUrl -Url '[INSERT ACTUAL URL]')) 'Placeholder URLs are rejected'
Assert-True (-not (Test-ZefValidHttpsUrl -Url 'http://example.com')) 'Non-https URLs are rejected'
Assert-True (Test-ZefValidHttpsUrl -Url 'https://support.microsoft.com/teams') 'Approved https URLs pass'

Write-Host ''
if ($failures -eq 0) {
    Write-Host 'All content update logic tests passed.' -ForegroundColor Green
    exit 0
}

Write-Host ("{0} test(s) failed." -f $failures) -ForegroundColor Red
exit 1
