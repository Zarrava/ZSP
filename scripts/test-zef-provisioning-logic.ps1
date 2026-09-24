#Requires -Version 7.4
<#
.SYNOPSIS
    Logic tests for ZEF SharePoint provisioning (no SharePoint connection).
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1'
Import-Module $modulePath -Force

$knownTenantId = Get-ZefReferenceTenantId
$validClientId = '44444444-4444-4444-4444-444444444444'
$seedPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'docs\ZEF-SHAREPOINT-DATA-SEED.md'

$failures = 0
$pnpCalls = [System.Collections.Generic.List[string]]@()

function Assert-True {
    param([bool]$Condition, [string]$Message)
    if ($Condition) { Write-Host "  [PASS] $Message" -ForegroundColor Green }
    else { Write-Host "  [FAIL] $Message" -ForegroundColor Red; $script:failures++ }
}

function Invoke-DryRunSimulation {
    param(
        [switch]$ConfirmDrafts,
        [hashtable]$ExistingLists = @{}
    )

    $context = New-ZefProvisioningContextForTest -DryRun -ExistingLists $ExistingLists
    $seed = Read-ZefSeedDataFromMarkdown -MarkdownPath $seedPath

    Invoke-ZefSharePointStructurePhase -Context $context -DryRun | Out-Null
    Invoke-ZefSharePointSeedPhase -Context $context -Seed $seed -DryRun -ConfirmDrafts:$ConfirmDrafts | Out-Null

    return $context
}

Write-Host 'ZEF SharePoint Provisioning Logic Tests' -ForegroundColor White
Write-Host ''

Write-Host 'Authentication preflight:' -ForegroundColor Cyan
try { Assert-ZefEntraClientIdPreflight -ClientId $null | Out-Null; Assert-True $false 'Missing Client ID is rejected' }
catch { Assert-True ($_.Exception.Message -match 'An Entra Application \(Client\) ID is required') 'Missing Client ID is rejected' }

try { Assert-ZefEntraClientIdPreflight -ClientId 'not-a-guid' | Out-Null; Assert-True $false 'Invalid Client ID is rejected' }
catch { Assert-True ($_.Exception.Message -match 'Invalid Entra Client ID format') 'Invalid Client ID is rejected' }

try { Assert-ZefEntraClientIdPreflight -ClientId $knownTenantId | Out-Null; Assert-True $false 'Tenant ID used as Client ID is rejected' }
catch { Assert-True ($_.Exception.Message -match 'ClientId matches the Tenant ID') 'Tenant ID used as Client ID is rejected' }

$preflight = Assert-ZefEntraClientIdPreflight -ClientId $validClientId
Assert-True ($preflight.ClientId -eq $validClientId) 'Valid Client ID passes preflight'

Write-Host ''
Write-Host 'Dry-run simulation against empty site:' -ForegroundColor Cyan
$emptyContext = Invoke-DryRunSimulation
foreach ($listTitle in @('ZEF Announcements', 'ZEF Departments', 'ZEF Resources')) {
    Assert-True $emptyContext.Lists[$listTitle].SimulatedCreated "Dry run simulates list creation: $listTitle"
}
Assert-True ($emptyContext.Lists['ZEF Announcements'].SimulatedItems.Count -gt 0) 'Dry run simulates announcement seed items'
Assert-True ($emptyContext.Lists['ZEF Departments'].SimulatedItems.Count -gt 0) 'Dry run simulates department seed items'
Assert-True ($emptyContext.Lists['ZEF Resources'].SimulatedItems.Count -eq 3) 'Dry run seeds confirmed Microsoft training resources'

$announcementItems = $emptyContext.Lists['ZEF Announcements'].SimulatedItems.Count
Assert-True ($announcementItems -eq 6) 'Dry run seeds 6 announcements (draft skipped by default)'

$departmentItems = $emptyContext.Lists['ZEF Departments'].SimulatedItems.Count
Assert-True ($departmentItems -eq 9) 'Dry run seeds 9 departments without URLs'

$resourceItems = $emptyContext.Lists['ZEF Resources'].SimulatedItems.Count
Assert-True ($resourceItems -eq 3) 'Dry run seeds confirmed training resources only'

Write-Host ''
Write-Host 'Dry-run duplicate protection in simulation:' -ForegroundColor Cyan
$secondPass = Invoke-DryRunSimulation
Assert-True ($secondPass.Lists['ZEF Announcements'].SimulatedItems.Count -eq 6) 'Second dry run still simulates same announcement count'

Write-Host ''
Write-Host 'Existing list/column idempotency (simulated):' -ForegroundColor Cyan
$existingContext = New-ZefProvisioningContextForTest -DryRun -ExistingLists @{
    'ZEF Announcements' = @('Body', 'Category', 'PublishedDate', 'Link', 'ExpiryDate', 'Priority')
}
Invoke-ZefSharePointStructurePhase -Context $existingContext -DryRun | Out-Null
Assert-True (-not $existingContext.Lists['ZEF Announcements'].SimulatedCreated) 'Existing list is not simulated as created'
Assert-True $existingContext.Lists['ZEF Departments'].SimulatedCreated 'Missing list is still simulated as created'

Write-Host ''
Write-Host 'Existing seed item duplicate detection (simulated):' -ForegroundColor Cyan
$dupContext = New-ZefProvisioningContextForTest -DryRun
Invoke-ZefSharePointStructurePhase -Context $dupContext -DryRun | Out-Null
$seed = Read-ZefSeedDataFromMarkdown -MarkdownPath $seedPath
Invoke-ZefSharePointSeedPhase -Context $dupContext -Seed $seed -DryRun | Out-Null
$beforeCount = $dupContext.Lists['ZEF Announcements'].SimulatedItems.Count
Invoke-ZefSharePointSeedPhase -Context $dupContext -Seed $seed -DryRun | Out-Null
Assert-True ($dupContext.Lists['ZEF Announcements'].SimulatedItems.Count -eq $beforeCount) 'Duplicate seed item is not simulated twice'

Write-Host ''
Write-Host 'Draft and placeholder handling:' -ForegroundColor Cyan
$draftContext = Invoke-DryRunSimulation -ConfirmDrafts
Assert-True ($draftContext.Lists['ZEF Announcements'].SimulatedItems.Count -eq 6) 'ConfirmDrafts does not change published announcement count'

Assert-True (Test-ZefPlaceholderValue -Value '[INSERT ACTUAL ZEF URL]') 'Placeholder detection works'
Assert-True (Test-ZefDraftAnnouncement -Announcement ([pscustomobject]@{ Title = '[INSERT ANNOUNCEMENT TITLE — CONFIRM BEFORE PUBLISHING]'; Body = 'x' })) 'Draft detection works'

Write-Host ''
Write-Host 'Field normalization:' -ForegroundColor Cyan
Assert-True ((ConvertFrom-ZefSharePointHyperlinkValue -Value ([pscustomobject]@{ Url = 'https://example.com'; Description = 'Example' })) -eq 'https://example.com') 'Hyperlink object URL is normalized'
Assert-True ((ConvertFrom-ZefSharePointHyperlinkValue -Value @{ Url = 'https://example.org' }) -eq 'https://example.org') 'Hyperlink hashtable URL is normalized'
Assert-True ((ConvertFrom-ZefSharePointHyperlinkValue -Value $null) -eq $null) 'Null hyperlink is safe'
Assert-True ((ConvertTo-ZefSharePointComparableValue -Value '2026-09-19T15:30:00' -FieldName 'PublishedDate') -eq '2026-09-19') 'DateTime compares by calendar day'
Assert-True ((ConvertTo-ZefSharePointComparableValue -Value 'Important' -FieldName 'Priority') -eq 'Important') 'Priority remains text-compatible'

Write-Host ''
Write-Host 'Provisioning order (lists before seed):' -ForegroundColor Cyan
$orderContext = New-ZefProvisioningContextForTest -DryRun
Invoke-ZefSharePointStructurePhase -Context $orderContext -DryRun | Out-Null
Assert-True ($orderContext.Lists['ZEF Announcements'].ExistsEffective) 'Structure phase marks simulated list effective before seed phase'
$seed = Read-ZefSeedDataFromMarkdown -MarkdownPath $seedPath
Invoke-ZefSharePointSeedPhase -Context $orderContext -Seed $seed -DryRun | Out-Null
Assert-True ($orderContext.Lists['ZEF Announcements'].SimulatedItems.Count -gt 0) 'Seed phase runs after simulated list creation'

Write-Host ''
if ($failures -eq 0) {
    Write-Host 'All provisioning logic tests passed.' -ForegroundColor Green
    exit 0
}

Write-Host ("{0} test(s) failed." -f $failures) -ForegroundColor Red
exit 1
