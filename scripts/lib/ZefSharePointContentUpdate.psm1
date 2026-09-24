# ZEF Digital Workplace — safe SharePoint list content update (upsert only)
# Updates approved Phase 4 content without list/column creation or destructive reseeding.

Set-StrictMode -Version Latest

$Script:ContentUpdateProvisioningModule = Join-Path $PSScriptRoot 'ZefSharePointProvisioning.psm1'
Import-Module $Script:ContentUpdateProvisioningModule -Global -Force

$Script:ZefContentUpdateListTitles = @{
    Announcements = 'ZEF Announcements'
    Departments   = 'ZEF Departments'
    Resources     = 'ZEF Resources'
}

function Test-ZefValidHttpsUrl {
    [CmdletBinding()]
    param(
        [AllowNull()]
        [AllowEmptyString()]
        [string]$Url
    )

    if ([string]::IsNullOrWhiteSpace($Url)) {
        return $false
    }

    if (Test-ZefPlaceholderValue -Value $Url) {
        return $false
    }

    return ($Url.Trim() -match '^https://')
}

function Write-ZefContentUpdateLine {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('UPDATE', 'ADD', 'SKIP', 'WARNING')]
        [string]$Action,

        [Parameter(Mandatory = $true)]
        [string]$ListTitle,

        [Parameter(Mandatory = $true)]
        [string]$Summary,

        [string]$Detail
    )

    $color = switch ($Action) {
        'UPDATE' { 'Cyan' }
        'ADD' { 'Green' }
        'SKIP' { 'DarkYellow' }
        'WARNING' { 'Yellow' }
    }

    $line = "[$Action] $ListTitle — $Summary"
    if (-not [string]::IsNullOrWhiteSpace($Detail)) {
        $line = "$line ($Detail)"
    }

    Write-Host $line -ForegroundColor $color
}

function Get-ZefSharePointListSnapshot {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$ListTitle,

        [Parameter(Mandatory = $true)]
        [string[]]$Fields
    )

    $fieldNames = @('Id', 'Title') + @($Fields | Where-Object { $_ -ne 'Title' }) | Select-Object -Unique
    $items = Get-PnPListItem -List $ListTitle -PageSize 2000 -Fields $fieldNames -ErrorAction Stop
    if ($null -eq $items) {
        $items = @()
    }
    else {
        $items = @($items)
    }

    $snapshot = [System.Collections.Generic.List[object]]::new()

    foreach ($item in $items) {
        $row = [ordered]@{
            Id    = [int]$item.Id
            Title = [string]$item['Title']
        }

        foreach ($fieldName in $fieldNames) {
            if ($fieldName -eq 'Id' -or $fieldName -eq 'Title') {
                continue
            }
            $row[$fieldName] = $item[$fieldName]
        }

        $snapshot.Add([pscustomobject]$row)
    }

    return @($snapshot)
}

function Find-ZefSharePointItemByTitle {
    [CmdletBinding()]
    param(
        [AllowEmptyCollection()]
        [array]$Items = @(),

        [Parameter(Mandatory = $true)]
        [string]$Title
    )

    if ($Items.Count -eq 0) {
        return $null
    }

    return ($Items | Where-Object { [string]$_.Title -eq $Title.Trim() } | Select-Object -First 1)
}

function Find-ZefSharePointAnnouncementItem {
    [CmdletBinding()]
    param(
        [AllowEmptyCollection()]
        [array]$Items = @(),

        [Parameter(Mandatory = $true)]
        [string]$Title,

        [Parameter(Mandatory = $true)]
        [string]$PublishedDate
    )

    if ($Items.Count -eq 0) {
        return $null
    }

    $expectedDate = ConvertTo-ZefSharePointComparableValue -Value $PublishedDate -FieldName 'PublishedDate'

    return (
        $Items | Where-Object {
            [string]$_.Title -eq $Title.Trim() -and
            (ConvertTo-ZefSharePointComparableValue -Value $_.PublishedDate -FieldName 'PublishedDate') -eq $expectedDate
        } | Select-Object -First 1
    )
}

function Get-ZefDepartmentContentChanges {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $SeedRow,

        [Parameter(Mandatory = $true)]
        $ExistingItem
    )

    $changes = [ordered]@{}

    if (-not [string]::IsNullOrWhiteSpace($SeedRow.Description)) {
        $expected = [string]$SeedRow.Description
        $actual = [string]$ExistingItem.Description
        if ($actual -ne $expected) {
            $changes.Description = $expected
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($SeedRow.Icon)) {
        $expected = [string]$SeedRow.Icon
        $actual = [string]$ExistingItem.Icon
        if ($actual -ne $expected) {
            $changes.Icon = $expected
        }
    }

    foreach ($urlField in @('SharePointSiteUrl', 'TeamsUrl')) {
        $seedUrl = [string]$SeedRow.$urlField
        $existingUrl = ConvertFrom-ZefSharePointHyperlinkValue -Value $ExistingItem.$urlField

        if (Test-ZefValidHttpsUrl -Url $seedUrl) {
            if ($existingUrl -ne $seedUrl.Trim()) {
                $changes[$urlField] = ConvertTo-ZefSharePointUrlValue -Url $seedUrl.Trim() -Description $SeedRow.Title
            }
        }
        elseif (-not [string]::IsNullOrWhiteSpace($existingUrl)) {
            if (Test-ZefPlaceholderValue -Value $existingUrl) {
                $changes[$urlField] = $null
            }
        }
    }

    return $changes
}

function Get-ZefAnnouncementContentChanges {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $SeedRow,

        [Parameter(Mandatory = $true)]
        $ExistingItem
    )

    $changes = [ordered]@{}

    if (-not [string]::IsNullOrWhiteSpace($SeedRow.Body) -and -not (Test-ZefPlaceholderValue -Value $SeedRow.Body)) {
        $expected = [string]$SeedRow.Body
        $actual = [string]$ExistingItem.Body
        if ($actual -ne $expected) {
            $changes.Body = $expected
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($SeedRow.Category)) {
        $expected = [string]$SeedRow.Category
        $actual = [string]$ExistingItem.Category
        if ($actual -ne $expected) {
            $changes.Category = $expected
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($SeedRow.Priority)) {
        $expected = [string]$SeedRow.Priority
        $actual = [string]$ExistingItem.Priority
        if ($actual -ne $expected) {
            $changes.Priority = $expected
        }
    }

    $expectedPublished = ConvertTo-ZefSharePointDateValue -Value $SeedRow.PublishedDate
    if ($expectedPublished) {
        $actualPublished = ConvertTo-ZefSharePointComparableValue -Value $ExistingItem.PublishedDate -FieldName 'PublishedDate'
        $expectedComparable = ConvertTo-ZefSharePointComparableValue -Value $expectedPublished -FieldName 'PublishedDate'
        if ($actualPublished -ne $expectedComparable) {
            $changes.PublishedDate = $expectedPublished
        }
    }

    $expectedExpiry = ConvertTo-ZefSharePointDateValue -Value $SeedRow.ExpiryDate
    $actualExpiry = ConvertTo-ZefSharePointComparableValue -Value $ExistingItem.ExpiryDate -FieldName 'ExpiryDate'
    $expectedExpiryComparable = if ($expectedExpiry) {
        ConvertTo-ZefSharePointComparableValue -Value $expectedExpiry -FieldName 'ExpiryDate'
    } else {
        $null
    }

    if ($expectedExpiryComparable -and $actualExpiry -ne $expectedExpiryComparable) {
        $changes.ExpiryDate = $expectedExpiry
    }
    elseif (-not $expectedExpiryComparable -and -not [string]::IsNullOrWhiteSpace($actualExpiry)) {
        $changes.ExpiryDate = $null
    }

    $seedLink = [string]$SeedRow.Link
    $existingLink = ConvertFrom-ZefSharePointHyperlinkValue -Value $ExistingItem.Link

    if (Test-ZefValidHttpsUrl -Url $seedLink) {
        if ($existingLink -ne $seedLink.Trim()) {
            $changes.Link = ConvertTo-ZefSharePointUrlValue -Url $seedLink.Trim() -Description $SeedRow.Title
        }
    }
    elseif ([string]::IsNullOrWhiteSpace($seedLink)) {
        if (-not [string]::IsNullOrWhiteSpace($existingLink)) {
            if (Test-ZefPlaceholderValue -Value $existingLink) {
                $changes.Link = $null
            }
            else {
                # Approved seed leaves link blank — do not remove a verified production URL automatically.
            }
        }
    }

    return $changes
}

function Get-ZefResourceSeedValues {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $SeedRow
    )

    if (-not (Test-ZefValidHttpsUrl -Url $SeedRow.Link)) {
        return $null
    }

    $values = [ordered]@{
        Title = [string]$SeedRow.Title
        Link  = ConvertTo-ZefSharePointUrlValue -Url $SeedRow.Link.Trim() -Description $SeedRow.Title
    }

    if (-not [string]::IsNullOrWhiteSpace($SeedRow.Description)) {
        $values.Description = [string]$SeedRow.Description
    }
    if (-not [string]::IsNullOrWhiteSpace($SeedRow.Icon)) {
        $values.Icon = [string]$SeedRow.Icon
    }
    if (-not [string]::IsNullOrWhiteSpace($SeedRow.ResourceCategory)) {
        $values.ResourceCategory = [string]$SeedRow.ResourceCategory
    }
    if (-not [string]::IsNullOrWhiteSpace($SeedRow.Audience)) {
        $values.Audience = [string]$SeedRow.Audience
    }

    return $values
}

function Invoke-ZefSharePointContentUpdatePhase {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $Seed,

        [switch]$DryRun,

        [switch]$StopOnWarning
    )

    $summary = [ordered]@{
        Update = 0
        Add    = 0
        Skip   = 0
        Warning = 0
    }

    $departmentsList = $Script:ZefContentUpdateListTitles.Departments
    $resourcesList = $Script:ZefContentUpdateListTitles.Resources
    $announcementsList = $Script:ZefContentUpdateListTitles.Announcements

    Write-Host '=== ZEF Departments (content update) ===' -ForegroundColor White
    $departmentItems = @(
        Get-ZefSharePointListSnapshot -ListTitle $departmentsList -Fields @(
            'Description', 'SharePointSiteUrl', 'TeamsUrl', 'Icon', 'SortOrder'
        )
    )

    foreach ($row in $Seed.Departments) {
        $existing = Find-ZefSharePointItemByTitle -Items $departmentItems -Title $row.Title
        if (-not $existing) {
            Write-ZefContentUpdateLine -Action 'WARNING' -ListTitle $departmentsList -Summary $row.Title -Detail 'department not found in SharePoint'
            $summary.Warning++
            if ($StopOnWarning) { throw "Unexpected department missing: $($row.Title)" }
            continue
        }

        $changes = Get-ZefDepartmentContentChanges -SeedRow $row -ExistingItem $existing
        if ($changes.Count -eq 0) {
            Write-ZefContentUpdateLine -Action 'SKIP' -ListTitle $departmentsList -Summary $row.Title -Detail 'already matches approved content'
            $summary.Skip++
            continue
        }

        $detail = ($changes.Keys | ForEach-Object { $_ }) -join ', '
        Write-ZefContentUpdateLine -Action 'UPDATE' -ListTitle $departmentsList -Summary $row.Title -Detail $detail
        $summary.Update++

        if (-not $DryRun) {
            Set-PnPListItem -List $departmentsList -Identity $existing.Id -Values $changes -ErrorAction Stop | Out-Null
        }
    }

    Write-Host ''
    Write-Host '=== ZEF Resources (content update) ===' -ForegroundColor White
    $resourceItems = @(
        Get-ZefSharePointListSnapshot -ListTitle $resourcesList -Fields @(
            'Description', 'Link', 'Icon', 'ResourceCategory', 'Audience'
        )
    )

    foreach ($row in $Seed.Resources) {
        $values = Get-ZefResourceSeedValues -SeedRow $row
        if ($null -eq $values) {
            continue
        }

        $seedUrl = ConvertFrom-ZefSharePointHyperlinkValue -Value $values.Link
        $existing = Find-ZefSharePointItemByTitle -Items $resourceItems -Title $row.Title
        if ($existing) {
            $existingUrl = ConvertFrom-ZefSharePointHyperlinkValue -Value $existing.Link
            if ($existingUrl -eq $seedUrl) {
                Write-ZefContentUpdateLine -Action 'SKIP' -ListTitle $resourcesList -Summary $row.Title -Detail 'already exists with approved URL'
                $summary.Skip++
            }
            else {
                Write-ZefContentUpdateLine -Action 'WARNING' -ListTitle $resourcesList -Summary $row.Title -Detail "existing URL differs ($existingUrl)"
                $summary.Warning++
                if ($StopOnWarning) { throw "Resource URL mismatch: $($row.Title)" }
            }
            continue
        }

        Write-ZefContentUpdateLine -Action 'ADD' -ListTitle $resourcesList -Summary $row.Title -Detail $seedUrl
        $summary.Add++

        if (-not $DryRun) {
            Add-PnPListItem -List $resourcesList -Values $values -ErrorAction Stop | Out-Null
        }
    }

    Write-Host ''
    Write-Host '=== ZEF Announcements (content update) ===' -ForegroundColor White
    $announcementItems = @(
        Get-ZefSharePointListSnapshot -ListTitle $announcementsList -Fields @(
            'Body', 'Category', 'PublishedDate', 'Link', 'ExpiryDate', 'Priority'
        )
    )

    foreach ($row in $Seed.Announcements) {
        if (Test-ZefDraftAnnouncement -Announcement $row) {
            continue
        }

        if ([string]::IsNullOrWhiteSpace($row.Title) -or (Test-ZefPlaceholderValue -Value $row.Title)) {
            continue
        }

        $existing = Find-ZefSharePointAnnouncementItem -Items $announcementItems -Title $row.Title -PublishedDate $row.PublishedDate
        if (-not $existing) {
            Write-ZefContentUpdateLine -Action 'WARNING' -ListTitle $announcementsList -Summary $row.Title -Detail "not found for PublishedDate $($row.PublishedDate)"
            $summary.Warning++
            if ($StopOnWarning) { throw "Expected announcement not found: $($row.Title)" }
            continue
        }

        $changes = Get-ZefAnnouncementContentChanges -SeedRow $row -ExistingItem $existing
        if ($changes.Count -eq 0) {
            Write-ZefContentUpdateLine -Action 'SKIP' -ListTitle $announcementsList -Summary $row.Title -Detail 'already matches approved content'
            $summary.Skip++
            continue
        }

        $detail = ($changes.Keys | ForEach-Object { $_ }) -join ', '
        Write-ZefContentUpdateLine -Action 'UPDATE' -ListTitle $announcementsList -Summary $row.Title -Detail $detail
        $summary.Update++

        if (-not $DryRun) {
            Set-PnPListItem -List $announcementsList -Identity $existing.Id -Values $changes -ErrorAction Stop | Out-Null
        }
    }

    return [pscustomobject]$summary
}

function Invoke-ZefSharePointContentValidation {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        $Seed
    )

    Write-Host ''
    Write-Host '=== Content Validation ===' -ForegroundColor White

    $allPassed = $true
    $departmentsList = $Script:ZefContentUpdateListTitles.Departments
    $resourcesList = $Script:ZefContentUpdateListTitles.Resources
    $announcementsList = $Script:ZefContentUpdateListTitles.Announcements

    $departmentItems = @(
        Get-ZefSharePointListSnapshot -ListTitle $departmentsList -Fields @(
            'Description', 'SharePointSiteUrl', 'TeamsUrl', 'Icon', 'SortOrder'
        )
    )
    $resourceItems = @(
        Get-ZefSharePointListSnapshot -ListTitle $resourcesList -Fields @(
            'Description', 'Link', 'Icon', 'ResourceCategory', 'Audience'
        )
    )
    $announcementItems = @(
        Get-ZefSharePointListSnapshot -ListTitle $announcementsList -Fields @(
            'Body', 'Category', 'PublishedDate', 'Link', 'ExpiryDate', 'Priority'
        )
    )

    $expectedDepartments = @($Seed.Departments).Count
    $matchedDepartments = 0
    foreach ($row in $Seed.Departments) {
        $existing = Find-ZefSharePointItemByTitle -Items $departmentItems -Title $row.Title
        if (-not $existing) {
            Write-Host "[FAIL] Department missing: $($row.Title)" -ForegroundColor Red
            $allPassed = $false
            continue
        }

        $changes = Get-ZefDepartmentContentChanges -SeedRow $row -ExistingItem $existing
        $sharePointUrl = ConvertFrom-ZefSharePointHyperlinkValue -Value $existing.SharePointSiteUrl
        $teamsUrl = ConvertFrom-ZefSharePointHyperlinkValue -Value $existing.TeamsUrl

        if ($changes.Count -gt 0) {
            Write-Host "[FAIL] Department not aligned: $($row.Title) ($($changes.Keys -join ', '))" -ForegroundColor Red
            $allPassed = $false
        }
        elseif ((Test-ZefPlaceholderValue -Value $sharePointUrl) -or (Test-ZefPlaceholderValue -Value $teamsUrl)) {
            Write-Host "[FAIL] Department has placeholder URL: $($row.Title)" -ForegroundColor Red
            $allPassed = $false
        }
        else {
            $matchedDepartments++
        }
    }

    if ($matchedDepartments -eq $expectedDepartments) {
        Write-Host "[PASS] Departments: $matchedDepartments/$expectedDepartments aligned" -ForegroundColor Green
    }

    $approvedResources = @($Seed.Resources | Where-Object { Test-ZefValidHttpsUrl -Url $_.Link })
    $matchedResources = 0
    foreach ($row in $approvedResources) {
        $existing = Find-ZefSharePointItemByTitle -Items $resourceItems -Title $row.Title
        if (-not $existing) {
            Write-Host "[FAIL] Resource missing: $($row.Title)" -ForegroundColor Red
            $allPassed = $false
            continue
        }

        $existingUrl = ConvertFrom-ZefSharePointHyperlinkValue -Value $existing.Link
        if (-not (Test-ZefValidHttpsUrl -Url $existingUrl)) {
            Write-Host "[FAIL] Resource invalid URL: $($row.Title)" -ForegroundColor Red
            $allPassed = $false
            continue
        }

        if ([string]$existing.ResourceCategory -ne [string]$row.ResourceCategory) {
            Write-Host "[FAIL] Resource category mismatch: $($row.Title)" -ForegroundColor Red
            $allPassed = $false
            continue
        }

        $matchedResources++
    }

    if ($matchedResources -eq $approvedResources.Count) {
        Write-Host "[PASS] Resources: $matchedResources/$($approvedResources.Count) confirmed training links" -ForegroundColor Green
    }

    $approvedAnnouncements = @($Seed.Announcements | Where-Object {
        -not (Test-ZefDraftAnnouncement -Announcement $_) -and
        -not [string]::IsNullOrWhiteSpace($_.Title) -and
        -not (Test-ZefPlaceholderValue -Value $_.Title)
    })
    $matchedAnnouncements = 0
    foreach ($row in $approvedAnnouncements) {
        $existing = Find-ZefSharePointAnnouncementItem -Items $announcementItems -Title $row.Title -PublishedDate $row.PublishedDate
        if (-not $existing) {
            Write-Host "[FAIL] Announcement missing: $($row.Title)" -ForegroundColor Red
            $allPassed = $false
            continue
        }

        $changes = Get-ZefAnnouncementContentChanges -SeedRow $row -ExistingItem $existing
        $existingLink = ConvertFrom-ZefSharePointHyperlinkValue -Value $existing.Link
        if ($changes.Count -gt 0) {
            Write-Host "[FAIL] Announcement not aligned: $($row.Title) ($($changes.Keys -join ', '))" -ForegroundColor Red
            $allPassed = $false
        }
        elseif (Test-ZefPlaceholderValue -Value $existingLink) {
            Write-Host "[FAIL] Announcement has placeholder link: $($row.Title)" -ForegroundColor Red
            $allPassed = $false
        }
        else {
            $matchedAnnouncements++
        }
    }

    if ($matchedAnnouncements -eq $approvedAnnouncements.Count) {
        Write-Host "[PASS] Announcements: $matchedAnnouncements/$($approvedAnnouncements.Count) aligned" -ForegroundColor Green
    }

    Write-Host ''
    if ($allPassed) {
        Write-Host 'CONTENT VALIDATION: PASS' -ForegroundColor Green
    }
    else {
        Write-Host 'CONTENT VALIDATION: FAIL' -ForegroundColor Red
    }

    return $allPassed
}

function Invoke-ZefSharePointContentUpdate {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidatePattern('^https://')]
        [string]$SiteUrl,

        [switch]$DryRun,

        [switch]$ValidateOnly,

        [switch]$StopOnWarning,

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

    if ([string]::IsNullOrWhiteSpace($SeedDataPath)) {
        $SeedDataPath = Join-Path (Get-ZefRepoRoot) 'docs\ZEF-SHAREPOINT-DATA-SEED.md'
    }

    $seed = Read-ZefSeedDataFromMarkdown -MarkdownPath $SeedDataPath

    Connect-ZefSharePointSite -SiteUrl $SiteUrl -ClientId $ClientId -Tenant $Tenant -AuthMode $AuthMode | Out-Null
    Write-Host ''

    if ($ValidateOnly) {
        return Invoke-ZefSharePointContentValidation -Seed $seed
    }

    $result = Invoke-ZefSharePointContentUpdatePhase -Seed $seed -DryRun:$DryRun -StopOnWarning:$StopOnWarning

    Write-Host ''
    Write-Host ('Summary: UPDATE={0} ADD={1} SKIP={2} WARNING={3}' -f $result.Update, $result.Add, $result.Skip, $result.Warning) -ForegroundColor White

    if (-not $DryRun) {
        Invoke-ZefSharePointContentValidation -Seed $seed | Out-Null
    }

    return $result
}

Export-ModuleMember -Function @(
    'Test-ZefValidHttpsUrl'
    'Get-ZefSharePointListSnapshot'
    'Find-ZefSharePointItemByTitle'
    'Find-ZefSharePointAnnouncementItem'
    'Get-ZefDepartmentContentChanges'
    'Get-ZefAnnouncementContentChanges'
    'Get-ZefResourceSeedValues'
    'Invoke-ZefSharePointContentUpdatePhase'
    'Invoke-ZefSharePointContentValidation'
    'Invoke-ZefSharePointContentUpdate'
)
