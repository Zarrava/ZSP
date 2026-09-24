#Requires -Version 7.4
<#
.SYNOPSIS
    Local validation for ZEF SharePoint provisioning tooling (no SharePoint changes).

.DESCRIPTION
    Parse-checks PowerShell scripts/modules and validates Client ID resolution,
    GUID format checks, and script parameter binding. Does not authenticate.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$modulePath = Join-Path $PSScriptRoot 'lib\ZefSharePointProvisioning.psm1'
$scriptFiles = @(
    (Join-Path $PSScriptRoot 'provision-zef-sharepoint.ps1')
    (Join-Path $PSScriptRoot 'update-zef-sharepoint-content.ps1')
    (Join-Path $PSScriptRoot 'validate-zef-sharepoint.ps1')
    (Join-Path $PSScriptRoot 'export-zef-sharepoint-config.ps1')
    (Join-Path $PSScriptRoot 'diagnose-zef-sharepoint.ps1')
    (Join-Path $PSScriptRoot 'preflight-zef-sharepoint-auth.ps1')
    (Join-Path $PSScriptRoot 'test-zef-provisioning-logic.ps1')
    (Join-Path $PSScriptRoot 'test-zef-content-update-logic.ps1')
    $modulePath
    (Join-Path $PSScriptRoot 'lib\ZefSharePointContentUpdate.psm1')
)

$knownTenantId = '607f8991-c6f3-4239-9bcf-31f33a5bf34d'

Write-Host 'ZEF SharePoint Provisioning Tooling Tests' -ForegroundColor White
Write-Host ''

$failures = 0

function Assert-True {
    param(
        [Parameter(Mandatory = $true)]
        [bool]$Condition,

        [Parameter(Mandatory = $true)]
        [string]$Message
    )

    if ($Condition) {
        Write-Host "  [PASS] $Message" -ForegroundColor Green
    }
    else {
        Write-Host "  [FAIL] $Message" -ForegroundColor Red
        $script:failures++
    }
}

Write-Host 'Parse check:' -ForegroundColor Cyan
foreach ($file in $scriptFiles) {
    $errors = $null
    $tokens = $null
    $null = [System.Management.Automation.Language.Parser]::ParseFile($file, [ref]$tokens, [ref]$errors)
    Assert-True -Condition ($errors.Count -eq 0) -Message "Parses cleanly: $file"
}

Import-Module $modulePath -Force

Write-Host ''
Write-Host 'Client ID resolution:' -ForegroundColor Cyan

$parameterClientId = '11111111-1111-1111-1111-111111111111'
$envClientId = '22222222-2222-2222-2222-222222222222'
$previousEnvClientId = $env:ENTRA_CLIENT_ID

try {
    Assert-True -Condition ((Resolve-ZefEntraClientId -ClientId $parameterClientId) -eq $parameterClientId) `
        -Message 'Parameter ClientId takes priority over environment variable'

    $env:ENTRA_CLIENT_ID = $envClientId
    Assert-True -Condition ((Resolve-ZefEntraClientId -ClientId $null) -eq $envClientId) `
        -Message 'ENTRA_CLIENT_ID environment variable is used when parameter is omitted'

    Remove-Item Env:ENTRA_CLIENT_ID -ErrorAction SilentlyContinue
    Assert-True -Condition ($null -eq (Resolve-ZefEntraClientId -ClientId $null)) `
        -Message 'Missing ClientId resolves to null (no default fallback)'
}
finally {
    if ($null -eq $previousEnvClientId) {
        Remove-Item Env:ENTRA_CLIENT_ID -ErrorAction SilentlyContinue
    }
    else {
        $env:ENTRA_CLIENT_ID = $previousEnvClientId
    }
}

Write-Host ''
Write-Host 'Client ID format validation:' -ForegroundColor Cyan
Assert-True -Condition (Test-ZefEntraClientIdFormat -ClientId '33333333-3333-3333-3333-333333333333') `
    -Message 'Valid GUID format passes validation'
Assert-True -Condition (-not (Test-ZefEntraClientIdFormat -ClientId 'not-a-guid')) `
    -Message 'Invalid ClientId format is rejected'
Assert-True -Condition (-not (Test-ZefEntraClientIdFormat -ClientId '')) `
    -Message 'Empty ClientId format is rejected'

Write-Host ''
Write-Host 'Missing ClientId error handling:' -ForegroundColor Cyan
$missingClientIdError = $null
try {
    Connect-ZefSharePointSite -SiteUrl 'https://example.sharepoint.com/sites/ZEF' -ClientId $null
}
catch {
    $missingClientIdError = $_.Exception.Message
}

Assert-True -Condition ($missingClientIdError -match 'An Entra Application \(Client\) ID is required') `
    -Message 'Connect-ZefSharePointSite stops with clear message when ClientId is missing'

Write-Host ''
Write-Host 'Invalid ClientId format error handling:' -ForegroundColor Cyan
$invalidFormatError = $null
try {
    Connect-ZefSharePointSite -SiteUrl 'https://example.sharepoint.com/sites/ZEF' -ClientId 'invalid-client-id'
}
catch {
    $invalidFormatError = $_.Exception.Message
}

Assert-True -Condition ($invalidFormatError -match 'Invalid Entra Client ID format') `
    -Message 'Connect-ZefSharePointSite stops before authentication when ClientId format is invalid'

Write-Host ''
Write-Host 'Tenant ID mistaken for Client ID:' -ForegroundColor Cyan
$tenantAsClientError = $null
try {
    Connect-ZefSharePointSite -SiteUrl 'https://example.sharepoint.com/sites/ZEF' -ClientId $knownTenantId
}
catch {
    $tenantAsClientError = $_.Exception.Message
}

Assert-True -Condition ($tenantAsClientError -match 'ClientId matches the Tenant ID') `
    -Message 'Connect-ZefSharePointSite rejects Tenant ID supplied as ClientId'

Write-Host ''
Write-Host 'Script parameter binding:' -ForegroundColor Cyan
foreach ($scriptName in @('provision-zef-sharepoint.ps1', 'update-zef-sharepoint-content.ps1', 'validate-zef-sharepoint.ps1', 'export-zef-sharepoint-config.ps1', 'diagnose-zef-sharepoint.ps1', 'preflight-zef-sharepoint-auth.ps1')) {
    $scriptPath = Join-Path $PSScriptRoot $scriptName
    $content = Get-Content -LiteralPath $scriptPath -Raw
    $hasClientId = $content -match '\[string\]\$ClientId'
    Assert-True -Condition $hasClientId -Message "$scriptName exposes -ClientId parameter"
}

Write-Host ''
Write-Host 'Hard-coded Client ID scan:' -ForegroundColor Cyan
$guidPattern = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
$hardCodedMatches = @()
$scanFiles = @(
    (Join-Path $PSScriptRoot 'provision-zef-sharepoint.ps1')
    (Join-Path $PSScriptRoot 'update-zef-sharepoint-content.ps1')
    (Join-Path $PSScriptRoot 'validate-zef-sharepoint.ps1')
    (Join-Path $PSScriptRoot 'export-zef-sharepoint-config.ps1')
    (Join-Path $PSScriptRoot 'diagnose-zef-sharepoint.ps1')
    (Join-Path $PSScriptRoot 'preflight-zef-sharepoint-auth.ps1')
    $modulePath
    (Join-Path $PSScriptRoot 'lib\ZefSharePointContentUpdate.psm1')
)
foreach ($file in $scanFiles) {
    $content = Get-Content -LiteralPath $file -Raw
    $contentWithoutTenantReference = $content -replace [regex]::Escape($knownTenantId), ''
    if ($contentWithoutTenantReference -match $guidPattern) {
        $hardCodedMatches += $file
    }
}

Assert-True -Condition ($hardCodedMatches.Count -eq 0) `
    -Message 'No hard-coded GUID Application (Client) IDs found in provisioning scripts/module'

Write-Host ''
if ($failures -eq 0) {
    Write-Host 'All local tooling tests passed.' -ForegroundColor Green
    exit 0
}

Write-Host ("{0} test(s) failed." -f $failures) -ForegroundColor Red
exit 1
