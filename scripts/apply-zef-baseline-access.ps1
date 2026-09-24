#Requires -Version 7.4
<#
.SYNOPSIS
    Grants org-wide baseline Read access to the ZEF Digital Workplace site for internal M365 users.

.DESCRIPTION
    Adds the SharePoint claim group "Everyone except external users" to the site Visitors group.
    Internal @zurfteempowercare.org users inherit access automatically without access requests.
    External/guest accounts are excluded. Site-level sharing remains disabled.
    Does not modify Owners, Members, or list-level unique permissions.

.PARAMETER DryRun
    Report planned changes without applying them.

.EXAMPLE
    .\scripts\apply-zef-baseline-access.ps1 `
      -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
      -ClientId $env:ENTRA_CLIENT_ID

.EXAMPLE
    .\scripts\apply-zef-baseline-access.ps1 `
      -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
      -DryRun
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

$EveryoneExceptExternalTitle = 'Everyone except external users'

function Get-ZefEveryoneExceptExternalLogin {
    $principal = Get-PnPUser | Where-Object {
        $_.Title -eq $EveryoneExceptExternalTitle -or
        $_.LoginName -match 'spo-grid-all-users'
    } | Select-Object -First 1

    if (-not $principal) {
        throw 'Could not resolve the SharePoint principal "Everyone except external users" in this tenant.'
    }

    if ($principal.LoginName -match '^c:0\(\.s\|true$') {
        throw 'Resolved "Everyone" instead of "Everyone except external users". Aborting to avoid granting external access.'
    }

    return [string]$principal.LoginName
}

$modulePath = Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1'
Import-Module $modulePath -Force

if (-not $ClientId) {
    $ClientId = $env:ENTRA_CLIENT_ID
}
if (-not $ClientId) {
    $ClientId = '265e3a54-3fe7-42fc-8434-7e4f9296b338'
}

function Test-ZefPrincipalInGroup {
    param(
        [AllowEmptyCollection()]
        [array]$Members = @(),

        [Parameter(Mandatory = $true)]
        [string]$LoginName,

        [Parameter(Mandatory = $true)]
        [string]$Title
    )

    if (-not $Members -or $Members.Count -eq 0) {
        return $false
    }

    return @($Members | Where-Object {
            $_.LoginName -eq $LoginName -or
            $_.LoginName -match 'spo-grid-all-users' -or
            $_.Title -eq $Title
        }).Count -gt 0
}

Write-Host 'ZEF Digital Workplace — Baseline Access Configuration' -ForegroundColor White
Write-Host "Site URL: $SiteUrl" -ForegroundColor White
if ($DryRun) {
    Write-Host 'Mode: DRY RUN (no changes will be applied)' -ForegroundColor Yellow
}
Write-Host ''

Connect-ZefSharePointSite -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null

$EveryoneExceptExternalLogin = Get-ZefEveryoneExceptExternalLogin
Write-Host ("Resolved org-wide principal: {0} ({1})" -f $EveryoneExceptExternalTitle, $EveryoneExceptExternalLogin) -ForegroundColor DarkGray

$web = Get-PnPWeb -Includes AssociatedVisitorGroup, AssociatedMemberGroup, AssociatedOwnerGroup, HasUniqueRoleAssignments, RequestAccessEmail
$visitorGroupTitle = $web.AssociatedVisitorGroup.Title

Write-Host '=== PRE-CHANGE STATE ===' -ForegroundColor Cyan
Write-Host ("Visitors group: {0}" -f $visitorGroupTitle)
Write-Host ("Site unique permissions: {0}" -f $web.HasUniqueRoleAssignments)
Write-Host ("Request access email: {0}" -f ($(if ($web.RequestAccessEmail) { $web.RequestAccessEmail } else { '(not configured)' })))

$visitorMembers = @(Get-PnPGroupMember -Identity $visitorGroupTitle)
Write-Host ("Visitors member count: {0}" -f $visitorMembers.Count)
foreach ($member in $visitorMembers) {
    Write-Host ("  - {0} ({1})" -f $member.Title, $member.LoginName)
}

$alreadyPresent = Test-ZefPrincipalInGroup -Members $visitorMembers -LoginName $EveryoneExceptExternalLogin -Title $EveryoneExceptExternalTitle

Write-Host ''
Write-Host '=== SHARING GUARDRAILS ===' -ForegroundColor Cyan
try {
    $siteSettings = Get-PnPTenantSite -Identity $SiteUrl -ErrorAction Stop
    Write-Host ("Site SharingCapability: {0}" -f $siteSettings.SharingCapability)
    if ($siteSettings.SharingCapability -ne 'Disabled') {
        Write-Host 'WARNING: Site sharing is not Disabled. External users invited to this site could receive access.' -ForegroundColor Yellow
        if (-not $DryRun -and $PSCmdlet.ShouldProcess($SiteUrl, 'Disable site collection external sharing')) {
            Set-PnPTenantSite -Identity $SiteUrl -SharingCapability Disabled
            Write-Host 'Applied: Site SharingCapability set to Disabled.' -ForegroundColor Green
        }
        elseif ($DryRun) {
            Write-Host 'DRY RUN: Would set Site SharingCapability to Disabled.' -ForegroundColor Yellow
        }
    }
    else {
        Write-Host 'Site sharing already Disabled — external link access blocked.' -ForegroundColor Green
    }
}
catch {
    Write-Host ("Could not verify site sharing settings: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
}

Write-Host ''
Write-Host '=== BASELINE ACCESS CHANGE ===' -ForegroundColor Cyan
if ($alreadyPresent) {
    Write-Host 'Everyone except external users is already in the Visitors group. No change required.' -ForegroundColor Green
}
else {
    Write-Host 'Planned: Add "Everyone except external users" to Visitors (Read access for all internal M365 users).' -ForegroundColor Yellow
    if (-not $DryRun) {
        if ($PSCmdlet.ShouldProcess($visitorGroupTitle, 'Add Everyone except external users')) {
            Add-PnPGroupMember -LoginName $EveryoneExceptExternalLogin -Identity $visitorGroupTitle -ErrorAction Stop
            Write-Host 'Applied: Everyone except external users added to Visitors group.' -ForegroundColor Green
        }
    }
}

Write-Host ''
Write-Host '=== POST-CHANGE VERIFICATION ===' -ForegroundColor Cyan
$visitorMembersAfter = @(Get-PnPGroupMember -Identity $visitorGroupTitle)
Write-Host ("Visitors member count: {0}" -f $visitorMembersAfter.Count)
foreach ($member in $visitorMembersAfter) {
    Write-Host ("  - {0} ({1})" -f $member.Title, $member.LoginName)
}

$verified = Test-ZefPrincipalInGroup -Members $visitorMembersAfter -LoginName $EveryoneExceptExternalLogin -Title $EveryoneExceptExternalTitle
if ($verified) {
    Write-Host 'Verification: Baseline org-wide Read access is configured.' -ForegroundColor Green
}
elseif ($DryRun) {
    Write-Host 'DRY RUN: Baseline access is not yet applied.' -ForegroundColor Yellow
}
else {
    throw 'Verification failed: Everyone except external users was not found in the Visitors group after apply.'
}

Write-Host ''
Write-Host '=== UNCHANGED (by design) ===' -ForegroundColor Cyan
Write-Host ("Owners group: {0}" -f $web.AssociatedOwnerGroup.Title)
Write-Host ("Members group: {0} (Edit — assign only to authorized publishers)" -f $web.AssociatedMemberGroup.Title)
Write-Host 'List-level unique permissions: not modified'
Write-Host 'Department destination sites: permissions remain independent'

$outputDir = Join-Path $PSScriptRoot 'output'
if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$result = [ordered]@{
    appliedAt      = (Get-Date).ToString('o')
    siteUrl        = $SiteUrl
    dryRun         = [bool]$DryRun
    visitorGroup   = $visitorGroupTitle
    baselineActive = $verified
    visitorMembers = @($visitorMembersAfter | ForEach-Object {
            @{
                title     = $_.Title
                loginName = $_.LoginName
            }
        })
}

$resultPath = Join-Path $outputDir 'zef-baseline-access-result.json'
$result | ConvertTo-Json -Depth 6 | Set-Content -Path $resultPath -Encoding UTF8
Write-Host ''
Write-Host ("Result saved to: {0}" -f $resultPath) -ForegroundColor Green

Disconnect-PnPOnline
