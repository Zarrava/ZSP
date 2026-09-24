# ZEF Digital Workplace — Tenant Setup Checklist

Manual actions required in Microsoft 365 / SharePoint.  
**Package file:** `sharepoint/solution/zef-digital-workplace.sppkg`

---

## SharePoint Admin Center

- [ ] Upload `zef-digital-workplace.sppkg` to the **App Catalog** (*Apps for SharePoint* library)
- [ ] Deploy the solution and enable **Make available to all sites**
- [ ] Go to **API access**
- [ ] Approve **`User.Read`**
- [ ] Approve **`Calendars.Read`**
- [ ] Approve **`Team.ReadBasic.All`**
- [ ] Approve **`Files.Read`**
- [ ] Approve **`Tasks.Read`**

---

## App Catalog

- [ ] Confirm solution **zef-digital-workplace-client-side-solution** shows as deployed
- [ ] Confirm version **1.0.0.0** is active

---

## SharePoint Site (target site)

- [ ] Install the app: **Site contents** → **New** → **App** → add **zef-digital-workplace-client-side-solution**

### Baseline access (all `@zurfteempowercare.org` staff)

Every internal M365 user should reach the Digital Workplace without requesting site access. Department and restricted content remains gated on destination sites/lists.

- [ ] Audit current permissions: `.\scripts\audit-zef-sharepoint-permissions.ps1 -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" -ClientId $env:ENTRA_CLIENT_ID`
- [ ] Apply org-wide Read baseline (Visitors): `.\scripts\apply-zef-baseline-access.ps1 -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" -ClientId $env:ENTRA_CLIENT_ID`
- [ ] Confirm **Everyone except external users** is in the site **Visitors** group
- [ ] Confirm site **SharingCapability** remains **Disabled** (externals cannot access via link alone)
- [ ] Assign **Members** (Edit) only to Authorized List Managers — not all staff
- [ ] See `docs/ZEF-BASELINE-ACCESS.md` for the full permission model

---

## SharePoint Provisioning (optional automation)

Before running provisioning scripts, create an Entra ID App Registration for PnP.PowerShell login. See `docs/SHAREPOINT-PROVISIONING.md` → **PnP.PowerShell Authentication / Entra App Registration**.

**Important:** Tenant ID (`607f8991-c6f3-4239-9bcf-31f33a5bf34d`) is **not** the Application (Client) ID. Copy the Client ID from Entra ID → App registrations → your app → Overview.

- [ ] Entra ID App Registration created for ZEF SharePoint provisioning
- [ ] SharePoint delegated permission **AllSites.FullControl** added and admin-consented
- [ ] Redirect URI `http://localhost` configured (Mobile and desktop applications)
- [ ] **Application (client) ID** copied from App registrations (not the Tenant/Directory ID; not committed to source control)
- [ ] `$env:ENTRA_CLIENT_ID` set to the **Application (client) ID** (or pass `-ClientId` to scripts)
- [ ] Preflight passed: `.\scripts\preflight-zef-sharepoint-auth.ps1 -ClientId $env:ENTRA_CLIENT_ID`
- [ ] Environment check passed: `.\scripts\diagnose-zef-sharepoint.ps1 -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" -ClientId $env:ENTRA_CLIENT_ID`
- [ ] Local logic tests passed: `.\scripts\test-zef-provisioning-logic.ps1`
- [ ] Dry run completed successfully (empty site OK): `.\scripts\provision-zef-sharepoint.ps1 -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" -ClientId $env:ENTRA_CLIENT_ID -SeedData -DryRun`

---

## List Creation (on target site)

> **Or use automation:** `scripts/provision-zef-sharepoint.ps1` can create lists and columns when run without `-DryRun`.

### ZEF Announcements
- [ ] Create list: **ZEF Announcements**
- [ ] Add column: **Body** (Multiple lines of text)
- [ ] Add column: **Category** (Single line of text)
- [ ] Add column: **PublishedDate** (Date and Time)
- [ ] Add column: **Link** (Hyperlink)
- [ ] Add column: **ExpiryDate** (Date and Time)
- [ ] Add column: **Priority** (Choice: Normal, Important, Urgent — default Normal)

### ZEF Departments
- [ ] Create list: **ZEF Departments**
- [ ] Add column: **Description** (Single line of text)
- [ ] Add column: **SharePointSiteUrl** (Hyperlink)
- [ ] Add column: **TeamsUrl** (Hyperlink)
- [ ] Add column: **Icon** (Single line of text)
- [ ] Add column: **SortOrder** (Number)

### ZEF Resources
- [ ] Create list: **ZEF Resources**
- [ ] Add column: **Description** (Single line of text)
- [ ] Add column: **Link** (Hyperlink) — required for each resource item
- [ ] Add column: **Icon** (Single line of text)
- [ ] Add column: **ResourceCategory** (Single line of text)
- [ ] Add column: **Audience** (Single line of text)

---

## List Population

- [ ] Populate **ZEF Departments** with ZEF department entries (include SharePoint and/or Teams URLs)
- [ ] Populate **ZEF Announcements** with published announcements
- [ ] Populate **ZEF Resources** with organizational resource links
- [ ] Apply SharePoint permissions to restrict any sensitive list content

---

## Page Configuration

- [ ] Create or edit the target modern SharePoint page
- [ ] Add the **ZEF Digital Workplace** web part
- [ ] Set web part to full width (recommended)
- [ ] Publish the page

## Site chrome / navigation (v1.0.8.0+)

See `docs/ZEF-SITE-CHROME-AUDIT.md` for the full audit and architecture.

- [ ] Audit site chrome: `.\scripts\audit-zef-site-chrome.ps1 -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" -ClientId $env:ENTRA_CLIENT_ID`
- [ ] Deploy App Catalog package **1.0.8.0** (includes ZEF Site Navigation Application Customizer + chrome hiding)
- [ ] Apply supported SharePoint header/nav settings: `.\scripts\apply-zef-site-chrome.ps1 -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" -ClientId $env:ENTRA_CLIENT_ID`
- [ ] Register Application Customizer on site: `.\scripts\register-zef-site-navigation.ps1 -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" -ClientId $env:ENTRA_CLIENT_ID`
- [ ] Confirm Microsoft 365 suite bar remains (platform limitation — not removed)
- [ ] Confirm ZEF navy site navigation appears once (no duplicate nav in web part header)

---

## Final Testing

- [ ] Signed-in user name appears in header
- [ ] Announcements section shows list data (or empty state if list is empty)
- [ ] Departments section shows list data with working links
- [ ] Resources section shows list data
- [ ] Upcoming Events section loads (after Graph approval)
- [ ] My Workspace sections load independently (Teams, Documents, Calendar, Tasks)
- [ ] Quick Access links work (Documents resolves via OneDrive)
- [ ] No homepage crash when a single section fails
- [ ] No confidential HR/leadership/EA data exposed to unauthorized users

---

*All items above are performed manually by a ZEF tenant administrator. Cursor does not upload packages or approve API permissions.*
