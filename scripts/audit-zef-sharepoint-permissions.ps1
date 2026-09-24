#Requires -Version 7.4
<#
.SYNOPSIS
    Read-only audit of ZEF SharePoint site permissions, groups, and sharing settings.

.EXAMPLE
    .\scripts\audit-zef-sharepoint-permissions.ps1 `
      -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
      -ClientId $env:ENTRA_CLIENT_ID
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

$modulePath = Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1'
Import-Module $modulePath -Force

if (-not $ClientId) {
    $ClientId = $env:ENTRA_CLIENT_ID
}
if (-not $ClientId) {
    $ClientId = '265e3a54-3fe7-42fc-8434-7e4f9296b338'
}

$audit = [ordered]@{
    auditedAt   = (Get-Date).ToString('o')
    siteUrl     = $SiteUrl
    site        = @{}
    groups      = @()
    roleAssignments = @()
    sharing     = @{}
    lists       = @()
    zefLists    = @()
    findings    = @()
}

Write-Host 'ZEF Digital Workplace — SharePoint Permission Audit' -ForegroundColor White
Write-Host "Site URL: $SiteUrl" -ForegroundColor White
Write-Host ''

Connect-ZefSharePointSite -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null

Write-Host '=== SITE INFO ===' -ForegroundColor Cyan
$web = Get-PnPWeb -Includes Title, Url, AssociatedMemberGroup, AssociatedVisitorGroup, AssociatedOwnerGroup, HasUniqueRoleAssignments, RoleAssignments
$audit.site = @{
    title                   = $web.Title
    url                     = $web.Url
    hasUniqueRoleAssignments = [bool]$web.HasUniqueRoleAssignments
    ownerGroup              = $web.AssociatedOwnerGroup.Title
    memberGroup             = $web.AssociatedMemberGroup.Title
    visitorGroup            = $web.AssociatedVisitorGroup.Title
}
Write-Host ("Title: {0}" -f $web.Title)
Write-Host ("Url: {0}" -f $web.Url)
Write-Host ("Unique permissions: {0}" -f $web.HasUniqueRoleAssignments)

Write-Host ''
Write-Host '=== ASSOCIATED GROUP MEMBERS ===' -ForegroundColor Cyan
foreach ($groupTitle in @($web.AssociatedOwnerGroup.Title, $web.AssociatedMemberGroup.Title, $web.AssociatedVisitorGroup.Title)) {
    $groupInfo = [ordered]@{
        title   = $groupTitle
        members = @()
    }
    try {
        $members = Get-PnPGroupMember -Identity $groupTitle -ErrorAction Stop
        Write-Host ("{0} ({1} members)" -f $groupTitle, $members.Count)
        foreach ($member in $members) {
            Write-Host ("  - {0} ({1})" -f $member.Title, $member.LoginName)
            $groupInfo.members += @{
                title     = $member.Title
                loginName = $member.LoginName
                principalType = [string]$member.PrincipalType
            }
        }
    }
    catch {
        Write-Host ("{0}: could not enumerate members — {1}" -f $groupTitle, $_.Exception.Message) -ForegroundColor Yellow
    }
    $audit.groups += $groupInfo
}

Write-Host ''
Write-Host '=== ALL SITE GROUPS ===' -ForegroundColor Cyan
Get-PnPGroup | ForEach-Object {
    Write-Host ("- {0} (Id {1})" -f $_.Title, $_.Id)
}

Write-Host ''
Write-Host '=== SITE-LEVEL ROLE ASSIGNMENTS ===' -ForegroundColor Cyan
Get-PnPProperty -ClientObject $web -Property RoleAssignments
foreach ($ra in $web.RoleAssignments) {
    Get-PnPProperty -ClientObject $ra -Property Member, RoleDefinitionBindings
    $member = $ra.Member
    $roles = @($ra.RoleDefinitionBindings | ForEach-Object { $_.Name })
    Write-Host ("- {0} [{1}] => {2}" -f $member.Title, $member.LoginName, ($roles -join ', '))
    $audit.roleAssignments += @{
        title     = $member.Title
        loginName = $member.LoginName
        roles     = $roles
    }
}

$everyoneExceptExternal = $audit.roleAssignments | Where-Object {
    $_.loginName -match 'spo-grid-all-users|everyone except external users|c:0\.t\|tenant'
}
$orgWideBaseline = $audit.groups | Where-Object {
    $_.members | Where-Object { $_.loginName -match 'spo-grid-all-users|everyone except external users|c:0\.t\|tenant' }
}

if ($everyoneExceptExternal -or $orgWideBaseline) {
    $audit.findings += 'Baseline org-wide access appears configured (Everyone except external users present).'
}
else {
    $audit.findings += 'No org-wide baseline group detected at site level — individual users may need explicit site access.'
}

Write-Host ''
Write-Host '=== SHARING / EXTERNAL SETTINGS ===' -ForegroundColor Cyan
try {
    $tenantSettings = Get-PnPTenant -ErrorAction Stop
    $audit.sharing.tenant = @{
        sharingCapability                         = [string]$tenantSettings.SharingCapability
        sharingDomainRestrictionMode              = [string]$tenantSettings.SharingDomainRestrictionMode
        sharingAllowedDomainList                  = [string]$tenantSettings.SharingAllowedDomainList
        sharingBlockedDomainList                  = [string]$tenantSettings.SharingBlockedDomainList
        requireAcceptingAccountMatchInvitedAccount  = [bool]$tenantSettings.RequireAcceptingAccountMatchInvitedAccount
    }
    Write-Host ("Tenant SharingCapability: {0}" -f $tenantSettings.SharingCapability)
    Write-Host ("Tenant SharingDomainRestrictionMode: {0}" -f $tenantSettings.SharingDomainRestrictionMode)
}
catch {
    Write-Host ("Tenant settings unavailable: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    $audit.sharing.tenantError = $_.Exception.Message
}

try {
    $siteSettings = Get-PnPTenantSite -Identity $SiteUrl -ErrorAction Stop
    $audit.sharing.site = @{
        sharingCapability            = [string]$siteSettings.SharingCapability
        sharingDomainRestrictionMode = [string]$siteSettings.SharingDomainRestrictionMode
        disableSharingForNonOwners   = [bool]$siteSettings.DisableSharingForNonOwners
    }
    Write-Host ("Site SharingCapability: {0}" -f $siteSettings.SharingCapability)
    Write-Host ("Site DisableSharingForNonOwners: {0}" -f $siteSettings.DisableSharingForNonOwners)
}
catch {
    Write-Host ("Site collection settings unavailable: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
    $audit.sharing.siteError = $_.Exception.Message
}

if ($audit.sharing.tenant.sharingCapability -eq 'ExternalUserSharingOnly' -or $audit.sharing.tenant.sharingCapability -eq 'ExternalUserAndGuestSharing') {
    $audit.findings += 'External sharing is enabled at tenant level — verify guests cannot inherit baseline site access without invitation.'
}

Write-Host ''
Write-Host '=== LISTS WITH UNIQUE PERMISSIONS ===' -ForegroundColor Cyan
Get-PnPList | ForEach-Object {
    $entry = @{
        title                    = $_.Title
        hidden                   = [bool]$_.Hidden
        hasUniqueRoleAssignments = [bool]$_.HasUniqueRoleAssignments
        itemCount                = [int]$_.ItemCount
    }
    $audit.lists += $entry
    if ($_.HasUniqueRoleAssignments) {
        Write-Host ("- {0} (Hidden: {1}, Items: {2})" -f $_.Title, $_.Hidden, $_.ItemCount)
    }
}

$uniqueLists = @($audit.lists | Where-Object { $_.hasUniqueRoleAssignments })
Write-Host ("Total lists: {0}, with unique permissions: {1}" -f $audit.lists.Count, $uniqueLists.Count)
if ($uniqueLists.Count -gt 0) {
    $audit.findings += ("{0} list(s) use unique permissions — department/restricted content may already be isolated." -f $uniqueLists.Count)
}

Write-Host ''
Write-Host '=== ZEF LISTS ===' -ForegroundColor Cyan
foreach ($name in @('ZEF Announcements', 'ZEF Departments', 'ZEF Resources')) {
    $list = Get-PnPList -Identity $name -ErrorAction SilentlyContinue
    if ($list) {
        Write-Host ("{0}: Unique={1}, ItemCount={2}" -f $name, $list.HasUniqueRoleAssignments, $list.ItemCount)
        $audit.zefLists += @{
            title                    = $name
            hasUniqueRoleAssignments = [bool]$list.HasUniqueRoleAssignments
            itemCount                = [int]$list.ItemCount
        }
    }
    else {
        Write-Host ("{0}: NOT FOUND" -f $name) -ForegroundColor Yellow
    }
}

Write-Host ''
Write-Host '=== FINDINGS ===' -ForegroundColor Cyan
foreach ($finding in $audit.findings) {
    Write-Host ("- {0}" -f $finding)
}

if (-not $OutputPath) {
    $outputDir = Join-Path $PSScriptRoot 'output'
    if (-not (Test-Path -LiteralPath $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir | Out-Null
    }
    $OutputPath = Join-Path $outputDir 'zef-permission-audit.json'
}

$audit | ConvertTo-Json -Depth 8 | Set-Content -Path $OutputPath -Encoding UTF8
Write-Host ''
Write-Host ("Audit saved to: {0}" -f $OutputPath) -ForegroundColor Green

Disconnect-PnPOnline
