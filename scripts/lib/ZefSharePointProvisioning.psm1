# ZEF Digital Workplace — SharePoint provisioning helpers
# Used by provision, validate, and export scripts.

Set-StrictMode -Version Latest

$Script:PlaceholderPattern = '\[INSERT'
$Script:DraftConfirmationPattern = 'CONFIRM BEFORE PUBLISHING'

# ZEF directory/tenant ID — used only to detect Tenant ID mistakenly supplied as Client ID.
# This is NOT an Entra Application (Client) ID and must never be passed to Connect-PnPOnline -ClientId.
$Script:ZefReferenceTenantId = '607f8991-c6f3-4239-9bcf-31f33a5bf34d'
$Script:CherkyDeviceCodesWritten = @{}

$Script:ZefListSchemas = @{
    Announcements = @{
        ListTitle  = 'ZEF Announcements'
        Template   = 'GenericList'
        UniqueKey  = @('Title', 'PublishedDate')
        Fields     = @(
            @{ InternalName = 'Body';          DisplayName = 'Body';          Type = 'Note';     Required = $false }
            @{ InternalName = 'Category';      DisplayName = 'Category';      Type = 'Text';     Required = $false }
            @{ InternalName = 'PublishedDate'; DisplayName = 'PublishedDate'; Type = 'DateTime'; Required = $false }
            @{ InternalName = 'Link';          DisplayName = 'Link';          Type = 'URL';      Required = $false }
            @{ InternalName = 'ExpiryDate';    DisplayName = 'ExpiryDate';    Type = 'DateTime'; Required = $false }
            @{
                InternalName = 'Priority'
                DisplayName  = 'Priority'
                Type         = 'Choice'
                Required     = $false
                Choices      = @('Normal', 'Important', 'Urgent')
                DefaultValue = 'Normal'
            }
        )
    }
    Departments = @{
        ListTitle  = 'ZEF Departments'
        Template   = 'GenericList'
        UniqueKey  = @('Title')
        Fields     = @(
            @{ InternalName = 'Description';       DisplayName = 'Description';       Type = 'Text';   Required = $false }
            @{ InternalName = 'SharePointSiteUrl'; DisplayName = 'SharePointSiteUrl'; Type = 'URL';    Required = $false }
            @{ InternalName = 'TeamsUrl';          DisplayName = 'TeamsUrl';          Type = 'URL';    Required = $false }
            @{ InternalName = 'Icon';              DisplayName = 'Icon';              Type = 'Text';   Required = $false }
            @{ InternalName = 'SortOrder';         DisplayName = 'SortOrder';         Type = 'Number'; Required = $false }
        )
    }
    Resources = @{
        ListTitle  = 'ZEF Resources'
        Template   = 'GenericList'
        UniqueKey  = @('Title')
        Fields     = @(
            @{ InternalName = 'Description';      DisplayName = 'Description';      Type = 'Text'; Required = $false }
            @{ InternalName = 'Link';             DisplayName = 'Link';             Type = 'URL';  Required = $false }
            @{ InternalName = 'Icon';             DisplayName = 'Icon';             Type = 'Text'; Required = $false }
            @{ InternalName = 'ResourceCategory'; DisplayName = 'ResourceCategory'; Type = 'Text'; Required = $false }
            @{ InternalName = 'Audience';         DisplayName = 'Audience';         Type = 'Text'; Required = $false }
        )
    }
}

function Get-ZefRepoRoot {
    [CmdletBinding()]
    param()

    return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..')).Path
}

function Test-ZefPlaceholderValue {
    [CmdletBinding()]
    param(
        [AllowNull()]
        [AllowEmptyString()]
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $false
    }

    return ($Value -match $Script:PlaceholderPattern)
}

function Test-ZefDraftAnnouncement {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $Announcement
    )

    $title = [string]$Announcement.Title
    $body = [string]$Announcement.Body
    return ($title -match $Script:DraftConfirmationPattern -or $body -match $Script:DraftConfirmationPattern)
}

function Read-ZefSeedDataFromMarkdown {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$MarkdownPath
    )

    if (-not (Test-Path -LiteralPath $MarkdownPath)) {
        throw "Seed data file not found: $MarkdownPath"
    }

    $lines = Get-Content -LiteralPath $MarkdownPath -Encoding UTF8
    $result = @{
        Announcements = [System.Collections.Generic.List[object]]@()
        Departments   = [System.Collections.Generic.List[object]]@()
        Resources     = [System.Collections.Generic.List[object]]@()
    }

    $section = $null
    $headers = $null
    $sectionUsesRowNumbers = $false

    foreach ($line in $lines) {
        if ($line -match '^## ZEF Announcements\b') {
            $section = 'Announcements'
            $headers = $null
            $sectionUsesRowNumbers = $false
            continue
        }
        if ($line -match '^## ZEF Departments\b') {
            $section = 'Departments'
            $headers = $null
            $sectionUsesRowNumbers = $false
            continue
        }
        if ($line -match '^## ZEF Resources\b') {
            $section = 'Resources'
            $headers = $null
            $sectionUsesRowNumbers = $false
            continue
        }
        if ($line -match '^## ') {
            $section = $null
            $headers = $null
            $sectionUsesRowNumbers = $false
            continue
        }

        if (-not $section) { continue }
        if ($line -notmatch '^\|') { continue }
        if ($line -match '^\|\s*-+\s*\|') { continue }

        $cells = @(
            ($line.Trim().Trim('|').Split('|') | ForEach-Object { $_.Trim() })
        )

        if ($null -eq $headers) {
            $headers = $cells
            if ($headers.Count -gt 0 -and $headers[0] -eq '#') {
                $sectionUsesRowNumbers = $true
                $headers = $headers[1..($headers.Count - 1)]
            }
            continue
        }

        if ($sectionUsesRowNumbers -and $cells.Count -gt 0 -and $cells[0] -match '^\d+$') {
            $cells = $cells[1..($cells.Count - 1)]
        }

        $row = [ordered]@{}
        for ($i = 0; $i -lt $headers.Count; $i++) {
            $header = $headers[$i]
            $value = if ($i -lt $cells.Count) { $cells[$i] } else { '' }
            $row[$header] = $value
        }

        $result[$section].Add([pscustomobject]$row)
    }

    return [pscustomobject]@{
        Announcements = @($result.Announcements)
        Departments   = @($result.Departments)
        Resources     = @($result.Resources)
    }
}

function Get-ZefReferenceTenantId {
    [CmdletBinding()]
    param()

    return $Script:ZefReferenceTenantId
}

function Resolve-ZefEntraClientId {
    [CmdletBinding()]
    param(
        [AllowNull()]
        [AllowEmptyString()]
        [string]$ClientId
    )

    if (-not [string]::IsNullOrWhiteSpace($ClientId)) {
        return $ClientId.Trim()
    }

    if (-not [string]::IsNullOrWhiteSpace($env:ENTRA_CLIENT_ID)) {
        return $env:ENTRA_CLIENT_ID.Trim()
    }

    return $null
}

function Resolve-ZefEntraTenantId {
    [CmdletBinding()]
    param(
        [AllowNull()]
        [AllowEmptyString()]
        [string]$Tenant
    )

    if (-not [string]::IsNullOrWhiteSpace($Tenant)) {
        return $Tenant.Trim()
    }

    if (-not [string]::IsNullOrWhiteSpace($env:ZEF_TENANT_ID)) {
        return $env:ZEF_TENANT_ID.Trim()
    }

    return $Script:ZefReferenceTenantId
}

function Test-ZefGuidEquals {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Left,

        [Parameter(Mandatory = $true)]
        [string]$Right
    )

    if (-not (Test-ZefEntraClientIdFormat -ClientId $Left)) {
        return $false
    }

    if (-not (Test-ZefEntraClientIdFormat -ClientId $Right)) {
        return $false
    }

    $leftGuid = [guid]$Left.Trim()
    $rightGuid = [guid]$Right.Trim()
    return ($leftGuid -eq $rightGuid)
}

function Test-ZefClientIdIsTenantId {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ClientId,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$Tenant
    )

    $tenantIds = @(
        (Resolve-ZefEntraTenantId -Tenant $Tenant)
        $Script:ZefReferenceTenantId
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

    foreach ($tenantId in $tenantIds) {
        if (Test-ZefGuidEquals -Left $ClientId -Right $tenantId) {
            return $true
        }
    }

    return $false
}

function Test-ZefEntraClientIdFormat {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [AllowNull()]
        [AllowEmptyString()]
        [string]$ClientId
    )

    if ([string]::IsNullOrWhiteSpace($ClientId)) {
        return $false
    }

    $parsed = [guid]::Empty
    return [guid]::TryParse($ClientId.Trim(), [ref]$parsed)
}

function Get-ZefEntraClientIdSource {
    [CmdletBinding()]
    param(
        [AllowNull()]
        [AllowEmptyString()]
        [string]$ClientId
    )

    if (-not [string]::IsNullOrWhiteSpace($ClientId)) {
        return 'Parameter'
    }

    if (-not [string]::IsNullOrWhiteSpace($env:ENTRA_CLIENT_ID)) {
        return 'EnvironmentVariable'
    }

    return 'Missing'
}

function Write-ZefEntraClientIdHint {
    Write-Host ''
    Write-Host 'An Entra Application (Client) ID is required. Tenant ID cannot be used as Client ID.' -ForegroundColor Yellow
    Write-Host ''
    Write-Host 'Tenant ID / Directory ID (NOT for -ClientId):' -ForegroundColor White
    Write-Host ('  {0}' -f $Script:ZefReferenceTenantId) -ForegroundColor DarkGray
    Write-Host ''
    Write-Host 'Application (Client) ID (required for -ClientId):' -ForegroundColor White
    Write-Host '  Microsoft Entra admin center -> App registrations -> your PnP app -> Application (client) ID' -ForegroundColor DarkGray
    Write-Host ''
    Write-Host 'Provide one of the following before running provisioning:' -ForegroundColor White
    Write-Host '  -ClientId ''YOUR-ENTRA-APP-CLIENT-ID''' -ForegroundColor Cyan
    Write-Host '  $env:ENTRA_CLIENT_ID = ''YOUR-ENTRA-APP-CLIENT-ID''' -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'See docs/SHAREPOINT-PROVISIONING.md -> PnP.PowerShell Authentication / Entra App Registration' -ForegroundColor DarkGray
}

function Assert-ZefEntraClientIdPreflight {
    [CmdletBinding()]
    param(
        [AllowNull()]
        [AllowEmptyString()]
        [string]$ClientId,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$Tenant,

        [ValidateSet('Interactive', 'DeviceLogin')]
        [string]$AuthMode = 'Interactive'
    )

    $resolvedClientId = Resolve-ZefEntraClientId -ClientId $ClientId
    $clientIdSource = Get-ZefEntraClientIdSource -ClientId $ClientId
    $resolvedTenantId = Resolve-ZefEntraTenantId -Tenant $Tenant

    if (-not $resolvedClientId) {
        Write-ZefEntraClientIdHint
        throw 'An Entra Application (Client) ID is required. Tenant ID cannot be used as Client ID.'
    }

    if (-not (Test-ZefEntraClientIdFormat -ClientId $resolvedClientId)) {
        throw 'Invalid Entra Client ID format. Expected a GUID (8-4-4-4-12 hexadecimal format).'
    }

    if (Test-ZefClientIdIsTenantId -ClientId $resolvedClientId -Tenant $Tenant) {
        Write-Host ''
        Write-Host 'ERROR: The supplied ClientId matches the Tenant ID. Provide the Application (Client) ID from Entra ID > App registrations.' -ForegroundColor Red
        Write-Host ''
        Write-Host 'Tenant ID / Directory ID (do NOT use as -ClientId):' -ForegroundColor Yellow
        Write-Host ('  {0}' -f $resolvedTenantId) -ForegroundColor DarkGray
        Write-Host ''
        Write-Host 'Where to find the correct Application (Client) ID:' -ForegroundColor Yellow
        Write-Host '  Microsoft Entra admin center -> App registrations -> ZEF SharePoint Provisioning app -> Overview -> Application (client) ID' -ForegroundColor DarkGray
        throw 'The supplied ClientId matches the Tenant ID. Provide the Application (Client) ID from Entra ID > App registrations.'
    }

    return [pscustomobject]@{
        ClientId       = $resolvedClientId
        ClientIdSource = $clientIdSource
        TenantId       = $resolvedTenantId
        AuthMode       = $AuthMode
    }
}

function Write-ZefMaskedClientId {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ClientId
    )

    if ($ClientId.Length -ge 8) {
        Write-Host ('Using Entra App Client ID: {0}-**** (source: resolved)' -f $ClientId.Substring(0, 8)) -ForegroundColor DarkGray
    }
    else {
        Write-Host 'Using Entra App Client ID: ****' -ForegroundColor DarkGray
    }
}

function Write-ZefDeviceLoginCodeToCherkyFile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$SiteUrl,

        [Parameter(Mandatory = $true)]
        [string]$DeviceCode,

        [string]$VerificationUrl = 'https://microsoft.com/devicelogin'
    )

    if ([string]::IsNullOrWhiteSpace($DeviceCode)) {
        return
    }

    $normalizedCode = $DeviceCode.Trim().ToUpperInvariant()
    if ($script:CherkyDeviceCodesWritten.ContainsKey($normalizedCode)) {
        return
    }

    $script:CherkyDeviceCodesWritten[$normalizedCode] = $true
    $cherkyPath = Join-Path (Get-ZefRepoRoot) 'cherky.txt'
    $entry = @(
        "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')"
        "Site URL: $SiteUrl"
        "Device login URL: $VerificationUrl"
        "Device code: $normalizedCode"
        ''
    ) -join [Environment]::NewLine

    Add-Content -LiteralPath $cherkyPath -Value $entry -Encoding utf8
    Write-Host "Device login code saved to cherky.txt: $normalizedCode" -ForegroundColor Yellow
}

function Get-ZefSharePointDeviceLoginAccessToken {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$SiteUrl,

        [Parameter(Mandatory = $true)]
        [string]$ClientId,

        [Parameter(Mandatory = $true)]
        [string]$TenantId
    )

    $siteUri = [Uri]$SiteUrl
    $sharePointScope = "https://$($siteUri.Host)/.default"
    $deviceCodeEndpoint = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/devicecode"
    $tokenEndpoint = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"

    $deviceCodeBody = @{
        client_id = $ClientId
        scope     = "$sharePointScope offline_access openid profile"
    }

    $deviceResponse = Invoke-RestMethod `
        -Method Post `
        -Uri $deviceCodeEndpoint `
        -Body $deviceCodeBody `
        -ContentType 'application/x-www-form-urlencoded' `
        -ErrorAction Stop

    $verificationUrl = if ([string]::IsNullOrWhiteSpace($deviceResponse.verification_uri)) {
        'https://microsoft.com/devicelogin'
    }
    else {
        $deviceResponse.verification_uri
    }

    Write-ZefDeviceLoginCodeToCherkyFile `
        -SiteUrl $SiteUrl `
        -DeviceCode $deviceResponse.user_code `
        -VerificationUrl $verificationUrl

    Write-Host "Human authentication required. Open $verificationUrl and enter the code in cherky.txt." -ForegroundColor Yellow

    $tokenBody = @{
        grant_type  = 'urn:ietf:params:oauth:grant-type:device_code'
        client_id   = $ClientId
        device_code = $deviceResponse.device_code
    }

    $deadline = (Get-Date).AddSeconds([int]$deviceResponse.expires_in)
    $pollInterval = [Math]::Max(5, [int]$deviceResponse.interval)

    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds $pollInterval

        try {
            $tokenResponse = Invoke-RestMethod `
                -Method Post `
                -Uri $tokenEndpoint `
                -Body $tokenBody `
                -ContentType 'application/x-www-form-urlencoded' `
                -ErrorAction Stop

            return [string]$tokenResponse.access_token
        }
        catch {
            $errorBody = $null
            if ($_.ErrorDetails.Message) {
                $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
            }

            if ($errorBody.error -eq 'authorization_pending') {
                continue
            }

            if ($errorBody.error -eq 'slow_down') {
                $pollInterval += 5
                continue
            }

            if ($errorBody.error -eq 'expired_token') {
                throw 'Verification code expired before contacting the server'
            }

            throw
        }
    }

    throw 'Verification code expired before contacting the server'
}

function Connect-ZefSharePointSite {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$SiteUrl,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$ClientId,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$Tenant,

        [ValidateSet('Interactive', 'DeviceLogin')]
        [string]$AuthMode = 'Interactive'
    )

    if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
        throw 'PnP.PowerShell module is not installed. Run: Install-Module PnP.PowerShell -Scope CurrentUser'
    }

    Import-Module PnP.PowerShell -ErrorAction Stop | Out-Null

    $preflight = Assert-ZefEntraClientIdPreflight -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode
    $resolvedClientId = $preflight.ClientId
    $clientIdSource = $preflight.ClientIdSource

    $authDescription = if ($AuthMode -eq 'DeviceLogin') { 'device login authentication' } else { 'interactive authentication' }
    Write-Host "Connecting to $SiteUrl ($authDescription)..." -ForegroundColor Cyan
    if ($resolvedClientId.Length -ge 8) {
        Write-Host ('Using Entra App Client ID: {0}-**** (source: {1})' -f $resolvedClientId.Substring(0, 8), $clientIdSource) -ForegroundColor DarkGray
    }
    else {
        Write-Host ('Using Entra App Client ID: **** (source: {0})' -f $clientIdSource) -ForegroundColor DarkGray
    }

    Write-Host ('Tenant ID (reference only, not used as Client ID): {0}-****' -f $preflight.TenantId.Substring(0, 8)) -ForegroundColor DarkGray

    try {
        if ($AuthMode -eq 'DeviceLogin') {
            $resolvedTenantId = Resolve-ZefEntraTenantId -Tenant $Tenant
            $accessToken = Get-ZefSharePointDeviceLoginAccessToken `
                -SiteUrl $SiteUrl `
                -ClientId $resolvedClientId `
                -TenantId $resolvedTenantId

            Connect-PnPOnline -Url $SiteUrl -AccessToken $accessToken -ErrorAction Stop | Out-Null
        }
        else {
            Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $resolvedClientId -ErrorAction Stop | Out-Null
        }
    }
    catch {
        $message = $_.Exception.Message
        Write-Host ''
        Write-Host 'Authentication failed before SharePoint site access was established.' -ForegroundColor Red

        if (Test-ZefClientIdIsTenantId -ClientId $resolvedClientId -Tenant $Tenant) {
            Write-Host 'Likely cause: The supplied value is the Tenant ID, not the Application (Client) ID.' -ForegroundColor Yellow
            Write-Host 'Next step: Use Entra ID > App registrations > Application (client) ID — not the Directory (tenant) ID.' -ForegroundColor Yellow
        }
        elseif ($message -match 'client id|clientid|application|AADSTS700016|invalid_client|AADSTS700011') {
            Write-Host 'Likely cause: Entra app registration/client ID is missing, incorrect, or not configured for login.' -ForegroundColor Yellow
            Write-Host 'Next step: Verify the App Registration exists, the Application (client) ID is correct, and redirect URIs include http://localhost for desktop auth.' -ForegroundColor Yellow
        }
        elseif ($message -match 'not supported|interactive') {
            Write-Host 'Likely cause: Interactive authentication is not available in this terminal session or the app registration is not configured for public client/native redirect.' -ForegroundColor Yellow
            Write-Host 'Next step: Retry with -AuthMode DeviceLogin, or confirm the Entra app uses Mobile and desktop applications with redirect URI http://localhost.' -ForegroundColor Yellow
        }
        else {
            Write-Host 'Next step: Complete the Microsoft sign-in prompt, verify the Application (client) ID, and confirm the app registration permissions.' -ForegroundColor Yellow
        }

        throw
    }

    try {
        $web = Get-PnPWeb -Includes Title, Url -ErrorAction Stop
        $context = Get-PnPContext
        $currentUser = $context.Web.CurrentUser
        $context.Load($currentUser)
        $context.ExecuteQuery()
    }
    catch {
        Write-Host ''
        Write-Host 'Authentication may have succeeded, but SharePoint site access failed.' -ForegroundColor Red
        Write-Host 'Likely cause: The signed-in user lacks permissions on the target site, or admin consent has not been granted for the app registration.' -ForegroundColor Yellow
        Write-Host 'Next step: Ensure the account is Site Owner (or equivalent) on the target site and that required delegated API permissions were admin-consented.' -ForegroundColor Yellow
        throw
    }

    Write-Host ('Authenticated as: {0} ({1})' -f $currentUser.Title, $currentUser.Email) -ForegroundColor Green
    Write-Host ('Target site: {0} - {1}' -f $web.Title, $web.Url) -ForegroundColor Green

    return [pscustomobject]@{
        Web         = $web
        CurrentUser = $currentUser
    }
}

function Test-ZefProvisioningEnvironment {
    [CmdletBinding()]
    param(
        [AllowNull()]
        [AllowEmptyString()]
        [string]$SiteUrl,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$ClientId,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$Tenant,

        [ValidateSet('Interactive', 'DeviceLogin')]
        [string]$AuthMode = 'Interactive'
    )

    Write-Host 'ZEF SharePoint Provisioning Environment Check' -ForegroundColor White
    Write-Host ''

    $psVersion = $PSVersionTable.PSVersion.ToString()
    Write-Host ('PowerShell version: {0}' -f $psVersion) -ForegroundColor White
    if ($PSVersionTable.PSVersion.Major -lt 7 -or ($PSVersionTable.PSVersion.Major -eq 7 -and $PSVersionTable.PSVersion.Minor -lt 4)) {
        Write-Host '  [FAIL] PowerShell 7.4+ is required.' -ForegroundColor Red
    }
    else {
        Write-Host '  [PASS] PowerShell 7.4+ requirement met.' -ForegroundColor Green
    }

    $pnpModule = Get-Module -ListAvailable PnP.PowerShell | Sort-Object Version -Descending | Select-Object -First 1
    if ($pnpModule) {
        Write-Host ('PnP.PowerShell version: {0}' -f $pnpModule.Version) -ForegroundColor White
        Write-Host '  [PASS] PnP.PowerShell is installed.' -ForegroundColor Green
    }
    else {
        Write-Host 'PnP.PowerShell version: (not installed)' -ForegroundColor White
        Write-Host '  [FAIL] Install with: Install-Module PnP.PowerShell -Scope CurrentUser' -ForegroundColor Red
    }

    if ([string]::IsNullOrWhiteSpace($SiteUrl)) {
        Write-Host 'Target SharePoint URL: (not provided)' -ForegroundColor White
        Write-Host '  [WARN] Provide -SiteUrl to validate the target site URL format.' -ForegroundColor DarkYellow
    }
    elseif ($SiteUrl -notmatch '^https://') {
        Write-Host ('Target SharePoint URL: {0}' -f $SiteUrl) -ForegroundColor White
        Write-Host '  [FAIL] Site URL must start with https://' -ForegroundColor Red
    }
    else {
        Write-Host ('Target SharePoint URL: {0}' -f $SiteUrl) -ForegroundColor White
        Write-Host '  [PASS] Site URL format looks valid.' -ForegroundColor Green
    }

    $resolvedTenantId = Resolve-ZefEntraTenantId -Tenant $Tenant
    Write-Host ('Tenant ID / Directory ID (reference): {0}' -f $resolvedTenantId) -ForegroundColor White
    Write-Host '  [INFO] Tenant ID is NOT used as -ClientId.' -ForegroundColor DarkGray

    Write-Host ('Auth mode: {0}' -f $AuthMode) -ForegroundColor White

    $source = Get-ZefEntraClientIdSource -ClientId $ClientId
    $resolvedClientId = Resolve-ZefEntraClientId -ClientId $ClientId

    if ($source -eq 'Missing') {
        Write-Host 'Entra Application (Client) ID: (missing)' -ForegroundColor White
        Write-Host '  [FAIL] An Entra Application (Client) ID is required. Tenant ID cannot be used as Client ID.' -ForegroundColor Red
    }
    else {
        Write-Host ('Entra Application (Client) ID source: {0}' -f $source) -ForegroundColor White
        Write-ZefMaskedClientId -ClientId $resolvedClientId
        if (-not (Test-ZefEntraClientIdFormat -ClientId $resolvedClientId)) {
            Write-Host '  [FAIL] Client ID is not a valid GUID.' -ForegroundColor Red
        }
        elseif (Test-ZefClientIdIsTenantId -ClientId $resolvedClientId -Tenant $Tenant) {
            Write-Host '  [FAIL] The supplied ClientId matches the Tenant ID. Provide the Application (Client) ID from Entra ID > App registrations.' -ForegroundColor Red
        }
        else {
            Write-Host '  [PASS] Client ID format is a valid GUID and does not match the Tenant ID.' -ForegroundColor Green
        }
    }

    Write-Host ''
    Write-Host 'No authentication was attempted by this diagnostic command.' -ForegroundColor DarkGray
}

function New-ZefProvisioningContext {
    [CmdletBinding()]
    param(
        [switch]$DryRun
    )

    $lists = @{}
    foreach ($schemaKey in @('Announcements', 'Departments', 'Resources')) {
        $schema = $Script:ZefListSchemas[$schemaKey]
        $listTitle = $schema.ListTitle
        $fields = @{}
        foreach ($field in $schema.Fields) {
            $fields[$field.InternalName] = [pscustomobject]@{
                InternalName       = $field.InternalName
                ExistsInSharePoint = $false
                ExistsEffective    = $false
                SimulatedCreated   = $false
            }
        }

        $lists[$listTitle] = [pscustomobject]@{
            ListTitle          = $listTitle
            SchemaKey          = $schemaKey
            ExistsInSharePoint = $false
            ExistsEffective    = $false
            SimulatedCreated   = $false
            Fields             = $fields
            SimulatedItems     = [System.Collections.Generic.List[hashtable]]@()
        }
    }

    return [pscustomobject]@{
        DryRun = [bool]$DryRun
        Lists  = $lists
    }
}

function Initialize-ZefProvisioningContextFromSite {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $Context
    )

    foreach ($listTitle in @($Context.Lists.Keys)) {
        $listState = $Context.Lists[$listTitle]
        $list = Get-PnPList -Identity $listTitle -ErrorAction SilentlyContinue
        if ($null -ne $list) {
            $listState.ExistsInSharePoint = $true
            $listState.ExistsEffective = $true

            foreach ($fieldName in @($listState.Fields.Keys)) {
                $field = Get-PnPField -List $listTitle -Identity $fieldName -ErrorAction SilentlyContinue
                if ($null -ne $field) {
                    $listState.Fields[$fieldName].ExistsInSharePoint = $true
                    $listState.Fields[$fieldName].ExistsEffective = $true
                }
            }
        }
    }

    return $Context
}

function New-ZefProvisioningContextForTest {
    [CmdletBinding()]
    param(
        [switch]$DryRun,

        [hashtable]$ExistingLists = @{}
    )

    $context = New-ZefProvisioningContext -DryRun:$DryRun
    foreach ($listTitle in @($ExistingLists.Keys)) {
        if (-not $context.Lists.ContainsKey($listTitle)) {
            continue
        }

        $listState = $context.Lists[$listTitle]
        $listState.ExistsInSharePoint = $true
        $listState.ExistsEffective = $true

        foreach ($fieldName in @($ExistingLists[$listTitle])) {
            if ($listState.Fields.ContainsKey($fieldName)) {
                $listState.Fields[$fieldName].ExistsInSharePoint = $true
                $listState.Fields[$fieldName].ExistsEffective = $true
            }
        }
    }

    return $context
}

function ConvertFrom-ZefSharePointHyperlinkValue {
    [CmdletBinding()]
    param(
        [AllowNull()]
        $Value
    )

    if ($null -eq $Value) {
        return $null
    }

    if ($Value -is [string]) {
        if ([string]::IsNullOrWhiteSpace($Value)) {
            return $null
        }

        if ($Value -match '^(?<url>https?://[^,]+)(?:,\s*(?<desc>.*))?$') {
            return $Matches['url'].Trim()
        }

        return $Value.Trim()
    }

    if ($Value -is [hashtable]) {
        foreach ($propertyName in @('Url', 'url', 'URI', 'uri')) {
            if ($Value.ContainsKey($propertyName) -and -not [string]::IsNullOrWhiteSpace([string]$Value[$propertyName])) {
                return ([string]$Value[$propertyName]).Trim()
            }
        }
    }

    foreach ($propertyName in @('Url', 'url', 'URI', 'uri')) {
        if ($Value.PSObject.Properties.Name -contains $propertyName) {
            $url = [string]$Value.$propertyName
            if (-not [string]::IsNullOrWhiteSpace($url)) {
                return $url.Trim()
            }
        }
    }

    return [string]$Value
}

function ConvertTo-ZefSharePointComparableValue {
    [CmdletBinding()]
    param(
        [AllowNull()]
        $Value,

        [string]$FieldName
    )

    if ($null -eq $Value) {
        return $null
    }

    if ($FieldName -match 'Url|Link') {
        return ConvertFrom-ZefSharePointHyperlinkValue -Value $Value
    }

    if ($FieldName -match 'Date') {
        try {
            return ([datetime]$Value).Date.ToString('yyyy-MM-dd')
        }
        catch {
            return [string]$Value
        }
    }

    if ($FieldName -eq 'SortOrder') {
        try {
            return ([double]$Value).ToString('G')
        }
        catch {
            return [string]$Value
        }
    }

    return [string]$Value
}

function Test-ZefProvisioningValuesMatch {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Expected,

        [Parameter(Mandatory = $true)]
        [hashtable]$Actual
    )

    foreach ($key in $Expected.Keys) {
        $expectedValue = [string](ConvertTo-ZefSharePointComparableValue -Value $Expected[$key] -FieldName $key)
        if ([string]::IsNullOrWhiteSpace($expectedValue)) {
            continue
        }

        if (-not $Actual.ContainsKey($key)) {
            return $false
        }

        $actualValue = [string](ConvertTo-ZefSharePointComparableValue -Value $Actual[$key] -FieldName $key)
        if ($actualValue -ne $expectedValue) {
            return $false
        }
    }

    return $true
}

function Test-ZefSharePointListExists {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ListTitle,

        $Context
    )

    if ($null -ne $Context -and $Context.Lists.ContainsKey($ListTitle)) {
        if ($Context.Lists[$ListTitle].ExistsEffective) {
            return $true
        }

        if ($Context.DryRun) {
            return $false
        }
    }

    $list = Get-PnPList -Identity $ListTitle -ErrorAction SilentlyContinue
    $exists = ($null -ne $list)

    if ($null -ne $Context -and $Context.Lists.ContainsKey($ListTitle) -and $exists) {
        $Context.Lists[$ListTitle].ExistsInSharePoint = $true
        $Context.Lists[$ListTitle].ExistsEffective = $true
    }

    return $exists
}

function Test-ZefSharePointFieldExists {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ListTitle,

        [Parameter(Mandatory = $true)]
        [string]$FieldInternalName,

        $Context
    )

    if ($null -ne $Context -and $Context.Lists.ContainsKey($ListTitle)) {
        $listState = $Context.Lists[$ListTitle]
        if (-not $listState.ExistsEffective) {
            return $false
        }

        if ($listState.Fields.ContainsKey($FieldInternalName) -and $listState.Fields[$FieldInternalName].ExistsEffective) {
            return $true
        }

        if ($Context.DryRun -and -not $listState.ExistsInSharePoint) {
            return $false
        }
    }

    if ($null -ne $Context -and $Context.DryRun -and $Context.Lists.ContainsKey($ListTitle) -and -not $Context.Lists[$ListTitle].ExistsInSharePoint) {
        return $false
    }

    $field = Get-PnPField -List $ListTitle -Identity $FieldInternalName -ErrorAction SilentlyContinue
    $exists = ($null -ne $field)

    if ($exists -and $null -ne $Context -and $Context.Lists.ContainsKey($ListTitle) -and $Context.Lists[$ListTitle].Fields.ContainsKey($FieldInternalName)) {
        $Context.Lists[$ListTitle].Fields[$FieldInternalName].ExistsInSharePoint = $true
        $Context.Lists[$ListTitle].Fields[$FieldInternalName].ExistsEffective = $true
    }

    return $exists
}

function New-ZefSharePointListIfMissing {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ListTitle,

        [Parameter(Mandatory = $true)]
        [string]$Template,

        [switch]$DryRun,

        [Parameter(Mandatory = $true)]
        $Context
    )

    if (Test-ZefSharePointListExists -ListTitle $ListTitle -Context $Context) {
        Write-Host ('[OK] List already exists: {0}' -f $ListTitle) -ForegroundColor DarkGreen
        return $false
    }

    if ($DryRun) {
        Write-Host ('[DRY RUN] Would create list: {0}' -f $ListTitle) -ForegroundColor Yellow
        if ($Context.Lists.ContainsKey($ListTitle)) {
            $Context.Lists[$ListTitle].ExistsEffective = $true
            $Context.Lists[$ListTitle].SimulatedCreated = $true
        }
        return $true
    }

    Write-Host "Creating list: $ListTitle" -ForegroundColor Cyan
    New-PnPList -Title $ListTitle -Template $Template -ErrorAction Stop | Out-Null
    if ($Context.Lists.ContainsKey($ListTitle)) {
        $Context.Lists[$ListTitle].ExistsInSharePoint = $true
        $Context.Lists[$ListTitle].ExistsEffective = $true
    }
    Write-Host ('[CREATED] List: {0}' -f $ListTitle) -ForegroundColor Green
    return $true
}

function New-ZefSharePointFieldIfMissing {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ListTitle,

        [Parameter(Mandatory = $true)]
        [hashtable]$FieldDefinition,

        [switch]$DryRun,

        [Parameter(Mandatory = $true)]
        $Context
    )

    $internalName = $FieldDefinition.InternalName

    if (-not (Test-ZefSharePointListExists -ListTitle $ListTitle -Context $Context)) {
        throw "Cannot create column '$internalName' because list '$ListTitle' does not exist."
    }

    if (Test-ZefSharePointFieldExists -ListTitle $ListTitle -FieldInternalName $internalName -Context $Context) {
        Write-Host ('  [OK] Column already exists: {0}' -f $internalName) -ForegroundColor DarkGreen
        return $false
    }

    if ($DryRun) {
        Write-Host ('  [DRY RUN] Would create column: {0} ({1})' -f $internalName, $FieldDefinition.Type) -ForegroundColor Yellow
        if ($Context.Lists.ContainsKey($ListTitle) -and $Context.Lists[$ListTitle].Fields.ContainsKey($internalName)) {
            $Context.Lists[$ListTitle].Fields[$internalName].ExistsEffective = $true
            $Context.Lists[$ListTitle].Fields[$internalName].SimulatedCreated = $true
        }
        return $true
    }

    Write-Host "  Creating column: $internalName ($($FieldDefinition.Type))" -ForegroundColor Cyan

    $params = @{
        List             = $ListTitle
        DisplayName      = $FieldDefinition.DisplayName
        InternalName     = $internalName
        Type             = $FieldDefinition.Type
        AddToDefaultView = $true
    }

    if ($FieldDefinition.ContainsKey('Choices')) {
        $params['Choices'] = $FieldDefinition.Choices
    }

    Add-PnPField @params -ErrorAction Stop | Out-Null

    if ($FieldDefinition.Type -eq 'Choice' -and $FieldDefinition.ContainsKey('DefaultValue')) {
        $field = Get-PnPField -List $ListTitle -Identity $internalName
        $field.DefaultValue = $FieldDefinition.DefaultValue
        $field.Update()
        Invoke-PnPQuery
    }

    if ($Context.Lists.ContainsKey($ListTitle) -and $Context.Lists[$ListTitle].Fields.ContainsKey($internalName)) {
        $Context.Lists[$ListTitle].Fields[$internalName].ExistsInSharePoint = $true
        $Context.Lists[$ListTitle].Fields[$internalName].ExistsEffective = $true
    }

    Write-Host ('  [CREATED] Column: {0}' -f $internalName) -ForegroundColor Green
    return $true
}

function ConvertTo-ZefSharePointUrlValue {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,

        [string]$Description = ''
    )

    if ([string]::IsNullOrWhiteSpace($Description)) {
        return $Url
    }

    return "$Url, $Description"
}

function ConvertTo-ZefSharePointDateValue {
    [CmdletBinding()]
    param(
        [AllowNull()]
        [AllowEmptyString()]
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    if (Test-ZefPlaceholderValue -Value $Value) {
        return $null
    }

    try {
        return ([datetime]$Value).ToString('s')
    }
    catch {
        return $null
    }
}

function Test-ZefListItemExists {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ListTitle,

        [Parameter(Mandatory = $true)]
        [hashtable]$KeyValues,

        [Parameter(Mandatory = $true)]
        $Context
    )

    if ($KeyValues.Count -eq 0) {
        return $false
    }

    if (-not $Context.Lists.ContainsKey($ListTitle)) {
        throw "Provisioning context does not include list '$ListTitle'."
    }

    $listState = $Context.Lists[$ListTitle]
    if (-not $listState.ExistsEffective) {
        return $false
    }

    foreach ($simulatedItem in @($listState.SimulatedItems)) {
        if (Test-ZefProvisioningValuesMatch -Expected $KeyValues -Actual $simulatedItem) {
            return $true
        }
    }

    if ($Context.DryRun -and -not $listState.ExistsInSharePoint) {
        return $false
    }

    $fieldNames = @($KeyValues.Keys | Select-Object -Unique)
    $allItems = @(Get-PnPListItem -List $ListTitle -PageSize 2000 -Fields $fieldNames -ErrorAction Stop)

    foreach ($item in $allItems) {
        $actualValues = @{}
        foreach ($key in $fieldNames) {
            $actualValues[$key] = $item[$key]
        }

        if (Test-ZefProvisioningValuesMatch -Expected $KeyValues -Actual $actualValues) {
            return $true
        }
    }

    return $false
}

function Add-ZefSharePointListItemIfMissing {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ListTitle,

        [Parameter(Mandatory = $true)]
        [hashtable]$Values,

        [Parameter(Mandatory = $true)]
        [string[]]$UniqueKey,

        [switch]$DryRun,

        [Parameter(Mandatory = $true)]
        $Context
    )

    if (-not (Test-ZefSharePointListExists -ListTitle $ListTitle -Context $Context)) {
        throw "Cannot seed list '$ListTitle' because the list does not exist."
    }

    $keyValues = @{}
    foreach ($key in $UniqueKey) {
        if ($Values.ContainsKey($key)) {
            $keyValues[$key] = $Values[$key]
        }
    }

    if (Test-ZefListItemExists -ListTitle $ListTitle -KeyValues $keyValues -Context $Context) {
        Write-Host ('  [SKIP] Existing record: {0}' -f ($keyValues.Values -join ' / ')) -ForegroundColor DarkYellow
        return $false
    }

    $displayKey = ($UniqueKey | ForEach-Object { "$_=$($Values[$_])" }) -join '; '

    if ($DryRun) {
        Write-Host ('  [DRY RUN] Would seed item: {0}' -f $displayKey) -ForegroundColor Yellow
        $Context.Lists[$ListTitle].SimulatedItems.Add(@{} + $Values) | Out-Null
        return $true
    }

    Add-PnPListItem -List $ListTitle -Values $Values -ErrorAction Stop | Out-Null
    Write-Host ('  [SEEDED] {0}' -f $displayKey) -ForegroundColor Green
    return $true
}

function Invoke-ZefSharePointStructurePhase {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $Context,

        [switch]$DryRun
    )

    foreach ($schemaKey in @('Announcements', 'Departments', 'Resources')) {
        $schema = $Script:ZefListSchemas[$schemaKey]
        $listTitle = $schema.ListTitle

        Write-Host "=== $listTitle ===" -ForegroundColor White
        New-ZefSharePointListIfMissing -ListTitle $listTitle -Template $schema.Template -DryRun:$DryRun -Context $Context | Out-Null

        foreach ($field in $schema.Fields) {
            New-ZefSharePointFieldIfMissing -ListTitle $listTitle -FieldDefinition $field -DryRun:$DryRun -Context $Context | Out-Null
        }

        Write-Host ''
    }
}

function Invoke-ZefSharePointSeedPhase {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $Context,

        [Parameter(Mandatory = $true)]
        $Seed,

        [switch]$DryRun,
        [switch]$AllowPlaceholders,
        [switch]$ConfirmDrafts
    )

    Write-Host '=== Seed Data ===' -ForegroundColor White

    foreach ($row in $seed.Announcements) {
        $isDraft = Test-ZefDraftAnnouncement -Announcement $row
        if ($isDraft -and -not $ConfirmDrafts) {
            Write-Host ('  [SKIP] Draft announcement requires confirmation: {0}' -f $row.Title) -ForegroundColor DarkYellow
            continue
        }

        $values = [ordered]@{ Title = $row.Title }

        if (-not [string]::IsNullOrWhiteSpace($row.Body) -and (-not (Test-ZefPlaceholderValue -Value $row.Body))) {
            $values.Body = $row.Body
        }

        if (-not [string]::IsNullOrWhiteSpace($row.Category)) {
            $values.Category = $row.Category
        }

        $published = ConvertTo-ZefSharePointDateValue -Value $row.PublishedDate
        if ($published) { $values.PublishedDate = $published }

        if (-not [string]::IsNullOrWhiteSpace($row.Link)) {
            if ((Test-ZefPlaceholderValue -Value $row.Link) -and -not $AllowPlaceholders) {
                Write-Host ('  [SKIP LINK] Placeholder URL in announcement: {0}' -f $row.Title) -ForegroundColor DarkYellow
            }
            elseif (-not (Test-ZefPlaceholderValue -Value $row.Link)) {
                $values.Link = ConvertTo-ZefSharePointUrlValue -Url $row.Link -Description $row.Title
            }
        }

        $expiry = ConvertTo-ZefSharePointDateValue -Value $row.ExpiryDate
        if ($expiry) { $values.ExpiryDate = $expiry }

        if (-not [string]::IsNullOrWhiteSpace($row.Priority)) {
            $values.Priority = [string]$row.Priority
        }

        if (-not $isDraft -and ([string]::IsNullOrWhiteSpace($values.Title) -or (Test-ZefPlaceholderValue -Value $values.Title))) {
            Write-Host ('  [SKIP] Announcement missing valid Title') -ForegroundColor DarkYellow
            continue
        }

        if ($isDraft -and $ConfirmDrafts -and (Test-ZefPlaceholderValue -Value $values.Title)) {
            Write-Host ('  [WARN] Draft announcement still contains placeholder Title; seeding only because -ConfirmDrafts was supplied: {0}' -f $row.Title) -ForegroundColor DarkYellow
        }

        Add-ZefSharePointListItemIfMissing `
            -ListTitle $Script:ZefListSchemas.Announcements.ListTitle `
            -Values $values `
            -UniqueKey $Script:ZefListSchemas.Announcements.UniqueKey `
            -DryRun:$DryRun `
            -Context $Context | Out-Null
    }

    foreach ($row in $seed.Departments) {
        $values = [ordered]@{
            Title = $row.Title
        }

        if (-not [string]::IsNullOrWhiteSpace($row.Description)) {
            $values.Description = $row.Description
        }

        if (-not [string]::IsNullOrWhiteSpace($row.SharePointSiteUrl)) {
            if ((Test-ZefPlaceholderValue -Value $row.SharePointSiteUrl) -and -not $AllowPlaceholders) {
                Write-Host ('  [SKIP URL] SharePointSiteUrl placeholder for department: {0}' -f $row.Title) -ForegroundColor DarkYellow
            }
            elseif (-not (Test-ZefPlaceholderValue -Value $row.SharePointSiteUrl)) {
                $values.SharePointSiteUrl = ConvertTo-ZefSharePointUrlValue -Url $row.SharePointSiteUrl -Description $row.Title
            }
        }

        if (-not [string]::IsNullOrWhiteSpace($row.TeamsUrl)) {
            if ((Test-ZefPlaceholderValue -Value $row.TeamsUrl) -and -not $AllowPlaceholders) {
                Write-Host ('  [SKIP URL] TeamsUrl placeholder for department: {0}' -f $row.Title) -ForegroundColor DarkYellow
            }
            elseif (-not (Test-ZefPlaceholderValue -Value $row.TeamsUrl)) {
                $values.TeamsUrl = ConvertTo-ZefSharePointUrlValue -Url $row.TeamsUrl -Description $row.Title
            }
        }

        if (-not [string]::IsNullOrWhiteSpace($row.Icon)) {
            $values.Icon = $row.Icon
        }

        if (-not [string]::IsNullOrWhiteSpace($row.SortOrder)) {
            $values.SortOrder = [double]$row.SortOrder
        }

        Add-ZefSharePointListItemIfMissing `
            -ListTitle $Script:ZefListSchemas.Departments.ListTitle `
            -Values $values `
            -UniqueKey $Script:ZefListSchemas.Departments.UniqueKey `
            -DryRun:$DryRun `
            -Context $Context | Out-Null
    }

    foreach ($row in $seed.Resources) {
        if ([string]::IsNullOrWhiteSpace($row.Link) -or ((Test-ZefPlaceholderValue -Value $row.Link) -and -not $AllowPlaceholders)) {
            Write-Host ('  [SKIP] Resource requires resolved Link: {0}' -f $row.Title) -ForegroundColor DarkYellow
            continue
        }

        if (Test-ZefPlaceholderValue -Value $row.Link) {
            Write-Host ('  [SKIP] Resource Link still placeholder (even with -AllowPlaceholders): {0}' -f $row.Title) -ForegroundColor DarkYellow
            continue
        }

        $values = [ordered]@{
            Title = $row.Title
            Link  = ConvertTo-ZefSharePointUrlValue -Url $row.Link -Description $row.Title
        }

        if (-not [string]::IsNullOrWhiteSpace($row.Description)) {
            $values.Description = $row.Description
        }
        if (-not [string]::IsNullOrWhiteSpace($row.Icon)) {
            $values.Icon = $row.Icon
        }
        if (-not [string]::IsNullOrWhiteSpace($row.ResourceCategory)) {
            $values.ResourceCategory = $row.ResourceCategory
        }
        if (-not [string]::IsNullOrWhiteSpace($row.Audience)) {
            $values.Audience = $row.Audience
        }

        Add-ZefSharePointListItemIfMissing `
            -ListTitle $Script:ZefListSchemas.Resources.ListTitle `
            -Values $values `
            -UniqueKey $Script:ZefListSchemas.Resources.UniqueKey `
            -DryRun:$DryRun `
            -Context $Context | Out-Null
    }
}

function Invoke-ZefSharePointProvisioningWork {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $Context,

        [switch]$SeedData,
        [switch]$DryRun,
        [switch]$AllowPlaceholders,
        [switch]$ConfirmDrafts,

        [string]$SeedDataPath
    )

    if ([string]::IsNullOrWhiteSpace($SeedDataPath)) {
        $SeedDataPath = Join-Path (Get-ZefRepoRoot) 'docs\ZEF-SHAREPOINT-DATA-SEED.md'
    }

    Invoke-ZefSharePointStructurePhase -Context $Context -DryRun:$DryRun

    if (-not $SeedData) {
        Write-Host 'Seed data skipped (-SeedData not specified).' -ForegroundColor DarkGray
        return
    }

    $seed = Read-ZefSeedDataFromMarkdown -MarkdownPath $SeedDataPath
    Invoke-ZefSharePointSeedPhase `
        -Context $Context `
        -Seed $seed `
        -DryRun:$DryRun `
        -AllowPlaceholders:$AllowPlaceholders `
        -ConfirmDrafts:$ConfirmDrafts
}

function Invoke-ZefSharePointProvisioning {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$SiteUrl,

        [switch]$SeedData,
        [switch]$DryRun,
        [switch]$AllowPlaceholders,
        [switch]$ConfirmDrafts,
        [string]$SeedDataPath,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$ClientId,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$Tenant,

        [ValidateSet('Interactive', 'DeviceLogin')]
        [string]$AuthMode = 'Interactive'
    )

    Connect-ZefSharePointSite -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null
    Write-Host ''

    $context = New-ZefProvisioningContext -DryRun:$DryRun
    Initialize-ZefProvisioningContextFromSite -Context $context | Out-Null

    Invoke-ZefSharePointProvisioningWork `
        -Context $context `
        -SeedData:$SeedData `
        -DryRun:$DryRun `
        -AllowPlaceholders:$AllowPlaceholders `
        -ConfirmDrafts:$ConfirmDrafts `
        -SeedDataPath $SeedDataPath
}

function Invoke-ZefSharePointValidation {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$SiteUrl,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$ClientId,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$Tenant,

        [ValidateSet('Interactive', 'DeviceLogin')]
        [string]$AuthMode = 'Interactive'
    )

    Connect-ZefSharePointSite -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null
    Write-Host ''
    Write-Host '=== Validation Results ===' -ForegroundColor White

    $allPassed = $true

    foreach ($schemaKey in @('Announcements', 'Departments', 'Resources')) {
        $schema = $Script:ZefListSchemas[$schemaKey]
        $listTitle = $schema.ListTitle

        if (Test-ZefSharePointListExists -ListTitle $listTitle) {
            Write-Host ('[PASS] List exists: {0}' -f $listTitle) -ForegroundColor Green
        }
        else {
            Write-Host ('[FAIL] List missing: {0}' -f $listTitle) -ForegroundColor Red
            $allPassed = $false
            continue
        }

        foreach ($field in $schema.Fields) {
            $internalName = $field.InternalName
            if (Test-ZefSharePointFieldExists -ListTitle $listTitle -FieldInternalName $internalName) {
                Write-Host ('  [PASS] Column exists: {0}' -f $internalName) -ForegroundColor Green
            }
            else {
                Write-Host ('  [FAIL] Column missing: {0}' -f $internalName) -ForegroundColor Red
                $allPassed = $false
            }
        }
    }

    Write-Host ''
    if ($allPassed) {
        Write-Host 'OVERALL: PASS' -ForegroundColor Green
    }
    else {
        Write-Host 'OVERALL: FAIL' -ForegroundColor Red
    }

    return $allPassed
}

function Export-ZefSharePointConfig {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$SiteUrl,

        [string]$OutputPath,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$ClientId,

        [AllowNull()]
        [AllowEmptyString()]
        [string]$Tenant,

        [ValidateSet('Interactive', 'DeviceLogin')]
        [string]$AuthMode = 'Interactive'
    )

    Connect-ZefSharePointSite -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null

    $export = [ordered]@{
        exportedAt = (Get-Date).ToString('o')
        siteUrl    = $SiteUrl
        lists      = @()
    }

    foreach ($schemaKey in @('Announcements', 'Departments', 'Resources')) {
        $schema = $Script:ZefListSchemas[$schemaKey]
        $listTitle = $schema.ListTitle
        $listEntry = [ordered]@{
            key        = $schemaKey
            listTitle  = $listTitle
            exists     = (Test-ZefSharePointListExists -ListTitle $listTitle)
            columns    = @()
        }

        if ($listEntry.exists) {
            $fields = Get-PnPField -List $listTitle | Where-Object {
                -not $_.Hidden -and -not $_.InternalName.StartsWith('_')
            }

            foreach ($expected in $schema.Fields) {
                $field = $fields | Where-Object { $_.InternalName -eq $expected.InternalName } | Select-Object -First 1
                $column = [ordered]@{
                    internalName = $expected.InternalName
                    displayName  = $expected.DisplayName
                    expectedType = $expected.Type
                    exists       = ($null -ne $field)
                }

                if ($field) {
                    $column.actualType = $field.TypeAsString
                    if ($field.TypeAsString -eq 'Choice') {
                        $column.choices = @($field.Choices)
                        $column.defaultValue = $field.DefaultValue
                    }
                }

                $listEntry.columns += [pscustomobject]$column
            }
        }

        $export.lists += [pscustomobject]$listEntry
    }

    $json = $export | ConvertTo-Json -Depth 8

    if ([string]::IsNullOrWhiteSpace($OutputPath)) {
        Write-Output $json
    }
    else {
        $json | Out-File -FilePath $OutputPath -Encoding UTF8
        Write-Host "Configuration exported to: $OutputPath" -ForegroundColor Green
    }

    return $export
}

Export-ModuleMember -Function @(
    'Get-ZefRepoRoot'
    'Get-ZefReferenceTenantId'
    'Resolve-ZefEntraClientId'
    'Resolve-ZefEntraTenantId'
    'Test-ZefEntraClientIdFormat'
    'Test-ZefClientIdIsTenantId'
    'Get-ZefEntraClientIdSource'
    'Assert-ZefEntraClientIdPreflight'
    'Test-ZefProvisioningEnvironment'
    'New-ZefProvisioningContext'
    'New-ZefProvisioningContextForTest'
    'Initialize-ZefProvisioningContextFromSite'
    'ConvertFrom-ZefSharePointHyperlinkValue'
    'ConvertTo-ZefSharePointUrlValue'
    'ConvertTo-ZefSharePointDateValue'
    'ConvertTo-ZefSharePointComparableValue'
    'Test-ZefProvisioningValuesMatch'
    'Test-ZefPlaceholderValue'
    'Test-ZefDraftAnnouncement'
    'Read-ZefSeedDataFromMarkdown'
    'Connect-ZefSharePointSite'
    'Invoke-ZefSharePointStructurePhase'
    'Invoke-ZefSharePointSeedPhase'
    'Invoke-ZefSharePointProvisioningWork'
    'Invoke-ZefSharePointProvisioning'
    'Invoke-ZefSharePointValidation'
    'Export-ZefSharePointConfig'
)
