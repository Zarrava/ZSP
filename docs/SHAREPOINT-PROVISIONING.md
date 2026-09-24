# ZEF SharePoint Provisioning

Automated provisioning for the three SharePoint lists used by the ZEF Digital Workplace homepage.

**Scripts:**
- `scripts/provision-zef-sharepoint.ps1` — create lists, columns, optional seed data
- `scripts/validate-zef-sharepoint.ps1` — verify lists and columns (read-only)
- `scripts/export-zef-sharepoint-config.ps1` — export list structure to JSON (no item data)
- `scripts/diagnose-zef-sharepoint.ps1` — read-only environment/auth readiness check
- `scripts/preflight-zef-sharepoint-auth.ps1` — validate Client ID before authentication (no SharePoint connection)
- `scripts/test-zef-provisioning-tooling.ps1` — local parse and auth-helper validation (no SharePoint changes)
- `scripts/test-zef-provisioning-logic.ps1` — dry-run simulation, idempotency, and seed logic tests (no SharePoint changes)

**Seed source:** `docs/ZEF-SHAREPOINT-DATA-SEED.md`

---

## Prerequisites

| Requirement | Details |
|---|---|
| PowerShell | **7.4 or later** (required by PnP.PowerShell 3.4.1) |
| Module | [PnP.PowerShell](https://pnp.github.io/powershell/) **3.4.1+** |
| Entra App Registration | Application (client) ID for interactive login (see below) |
| Account | SharePoint site owner or administrator on the **target site** |
| Site | Target ZEF SharePoint site URL (not hard-coded in scripts) |

### Install PnP.PowerShell

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
```

Update if needed:

```powershell
Update-Module PnP.PowerShell
```

---

## Required Permissions

The account running the script must be able to:

- Sign in interactively to the ZEF Microsoft 365 tenant
- Access the target SharePoint site
- **Create lists and columns** on the target site
- **Add list items** (when using `-SeedData`)

Recommended roles:

| Role | Suitable? |
|---|---|
| SharePoint Site Owner on target site | Yes (recommended) |
| SharePoint Administrator | Yes |
| Global Administrator | Yes (not required) |
| General member without list edit rights | No |

The script does **not** modify tenant-wide permissions, anonymous access, or sharing policies.

---

## Which Account Should Run the Script

Run the script as a **ZEF SharePoint Site Owner** or **Authorized List Manager** who:

1. Has permission to create lists on the target site
2. Understands the data governance rules in `docs/ZEF-SHAREPOINT-DATA-GOVERNANCE.md`
3. Will replace placeholder URLs with real ZEF destinations after provisioning

Do **not** run as a shared credential. Use interactive sign-in only.

---

## PnP.PowerShell Authentication / Entra App Registration

PnP.PowerShell **3.4.1** requires your own **Entra ID App Registration** for login. The scripts do **not** hard-code an Application (Client) ID.

### Tenant ID vs Application (Client) ID — do not confuse these

| Identifier | Value / source | Used for |
|---|---|---|
| **Tenant ID / Directory ID** | `607f8991-c6f3-4239-9bcf-31f33a5bf34d` | Identifies the ZEF Microsoft 365 tenant. **Do NOT use as `-ClientId`.** |
| **Tenant domain** | `zurfteempowercare.org` | Sign-in and DNS reference only |
| **SharePoint site** | `https://zurfteempowercare.sharepoint.com/sites/ZEF` | Target site (`-SiteUrl`) |
| **Application (Client) ID** | From Entra ID → App registrations → your PnP app → **Application (client) ID** | **Required** for `-ClientId` |

The scripts reject the Tenant ID if it is mistakenly supplied as `-ClientId`.

Provide the Application (client) ID using either:

1. **Script parameter:** `-ClientId "YOUR-ENTRA-APP-CLIENT-ID"`
2. **Environment variable:** `$env:ENTRA_CLIENT_ID = "YOUR-ENTRA-APP-CLIENT-ID"`

Optional tenant reference (for validation only — not sent as Client ID):

- **Parameter:** `-Tenant "607f8991-c6f3-4239-9bcf-31f33a5bf34d"`
- **Environment variable:** `$env:ZEF_TENANT_ID`

Resolution priority: `-ClientId` parameter → `$env:ENTRA_CLIENT_ID` → stop with a clear error.

### Auth modes

| Mode | Connect behaviour | When to use |
|---|---|---|
| `Interactive` (default) | Browser popup sign-in | Normal use in an interactive PowerShell window |
| `DeviceLogin` | Device code flow in terminal | When browser popup/MFA is unreliable |

```powershell
-AuthMode Interactive   # default
-AuthMode DeviceLogin    # alternative
```

### Create the App Registration (one-time)

**Recommended (automatic):**

```powershell
Import-Module PnP.PowerShell

Register-PnPEntraIDAppForInteractiveLogin `
  -ApplicationName "ZEF SharePoint Provisioning" `
  -Tenant "zurfteempowercare.onmicrosoft.com" `
  -SharePointDelegatePermissions AllSites.FullControl
```

**Manual alternative:** See [Register an Entra ID Application to use with PnP PowerShell](https://pnp.github.io/powershell/articles/registerapplication.html).

Manual setup checklist:

1. Entra ID → App registrations → New registration
2. Authentication → Add platform → **Mobile and desktop applications**
3. Custom redirect URI: `http://localhost` (http, not https)
4. API permissions → **SharePoint** → Delegated → **AllSites.FullControl** (minimum for list/column provisioning)
5. Grant **admin consent** for the tenant (required for SharePoint delegated permissions)

Copy the **Application (client) ID** GUID. Do not commit it to source control.

### Authentication behaviour

Interactive (default):

```powershell
Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId
```

Device login (alternative):

```powershell
Connect-PnPOnline -Url $SiteUrl -DeviceLogin -ClientId $ClientId
```

- No passwords, tokens, or Application (Client) IDs are stored in the repository
- Client IDs are masked in script output (first 8 characters only)
- PnP may cache tokens in the OS credential store (standard Microsoft behaviour)

### Preflight check (no SharePoint connection)

Validate your Application (Client) ID **before** authenticating:

```powershell
cd "C:\Users\user\Downloads\Zee Baba\ZEF SPT\zef-digital-workplace"

$env:ENTRA_CLIENT_ID = "YOUR-ENTRA-APP-CLIENT-ID"

.\scripts\preflight-zef-sharepoint-auth.ps1 -ClientId $env:ENTRA_CLIENT_ID
```

Expected: `Preflight result: PASS` and a masked Client ID that does **not** match the Tenant ID.

### Environment diagnostic (no authentication)

```powershell
cd "C:\Users\user\Downloads\Zee Baba\ZEF SPT\zef-digital-workplace"

$env:ENTRA_CLIENT_ID = "YOUR-ENTRA-APP-CLIENT-ID"

.\scripts\diagnose-zef-sharepoint.ps1 `
  -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
  -ClientId $env:ENTRA_CLIENT_ID
```

### Local tooling validation (no SharePoint changes)

```powershell
.\scripts\test-zef-provisioning-tooling.ps1
```

---

## Dry Run (Recommended First Step)

Inspect what would be created **without making changes**:

```powershell
cd "C:\Users\user\Downloads\Zee Baba\ZEF SPT\zef-digital-workplace"

$env:ENTRA_CLIENT_ID = "YOUR-ENTRA-APP-CLIENT-ID"

.\scripts\provision-zef-sharepoint.ps1 `
  -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
  -ClientId $env:ENTRA_CLIENT_ID `
  -SeedData `
  -DryRun
```

Dry run will:

1. Authenticate interactively (or device login with `-AuthMode DeviceLogin`)
2. Verify access to the target site
3. Read existing lists/columns from SharePoint (read-only)
4. Simulate list/column creation in memory when they are missing
5. Simulate seed record insertion against the in-memory state (never calls `Get-PnPListItem` for lists that do not exist yet)
6. Show which seed records would be inserted or skipped
7. Make **no changes** — no `[CREATED]`, `[SEEDED]`, `[UPDATED]`, or `[DELETED]` output

Dry run with `-SeedData` works against a **completely empty** SharePoint site.

### Local logic tests (no SharePoint connection)

```powershell
.\scripts\test-zef-provisioning-logic.ps1
.\scripts\test-zef-provisioning-tooling.ps1
```

---

## Actual Provisioning

Create lists and columns (no seed data):

```powershell
$env:ENTRA_CLIENT_ID = "YOUR-ENTRA-APP-CLIENT-ID"

.\scripts\provision-zef-sharepoint.ps1 `
  -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
  -ClientId $env:ENTRA_CLIENT_ID
```

Create lists, columns, and safe seed data:

```powershell
$env:ENTRA_CLIENT_ID = "YOUR-ENTRA-APP-CLIENT-ID"

.\scripts\provision-zef-sharepoint.ps1 `
  -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
  -ClientId $env:ENTRA_CLIENT_ID `
  -SeedData
```

### Safe seed behaviour (default)

| Rule | Behaviour |
|---|---|
| Placeholder URLs (`[INSERT …]`) | Skipped — not written to SharePoint |
| Draft announcement (row 7) | Skipped unless `-ConfirmDrafts` |
| Duplicate records | Skipped (Announcements: `Title` + `PublishedDate`; Departments/Resources: `Title`) |
| Resource without resolved Link | Skipped entirely |

### Optional flags

| Flag | Purpose |
|---|---|
| `-AllowPlaceholders` | Allows optional URL fields on announcements/departments to be omitted when placeholders are detected (still does not insert placeholder URLs) |
| `-ConfirmDrafts` | Allows insertion of the draft Leadership announcement marked for confirmation |
| `-SeedDataPath` | Override path to seed markdown (default: `docs/ZEF-SHAREPOINT-DATA-SEED.md`) |

---

## Validation

Verify lists and columns after provisioning:

```powershell
$env:ENTRA_CLIENT_ID = "YOUR-ENTRA-APP-CLIENT-ID"

.\scripts\validate-zef-sharepoint.ps1 `
  -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
  -ClientId $env:ENTRA_CLIENT_ID
```

Reports **PASS** or **FAIL** for each list and column. Does not modify anything.

Exit code `0` = pass, `1` = fail.

---

## Export Configuration

Export list/column structure to JSON (no list item data):

```powershell
$env:ENTRA_CLIENT_ID = "YOUR-ENTRA-APP-CLIENT-ID"

.\scripts\export-zef-sharepoint-config.ps1 `
  -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
  -ClientId $env:ENTRA_CLIENT_ID `
  -OutputPath ".\scripts\output\zef-sharepoint-config.json"
```

Use for backup/documentation of the site structure.

---

## What the Script Creates

### Lists

| List | Template |
|---|---|
| `ZEF Announcements` | Generic List |
| `ZEF Departments` | Generic List |
| `ZEF Resources` | Generic List |

### Columns

See `docs/DEPLOYMENT.md` → **SharePoint List Configuration** for the full schema.

### Seed data (with `-SeedData`)

From `docs/ZEF-SHAREPOINT-DATA-SEED.md`:

- Announcements without placeholder-only blocking fields (typically 1–2 safe records such as the "lists being configured" announcement)
- All 9 department records (without placeholder URLs until you update them manually)
- Resources are **skipped by default** until real URLs replace placeholders

---

## What the Script Refuses to Create

- Duplicate lists
- Duplicate columns
- Duplicate seed records (by unique key)
- Records containing unresolved `[INSERT …]` placeholder URLs (default)
- Draft announcement requiring confirmation (default)
- Resource items without a resolved Link URL
- Anonymous or public sharing links
- Permission changes on existing content

---

## Rerunning Safely (Idempotency)

The script is safe to run multiple times:

```powershell
.\scripts\provision-zef-sharepoint.ps1 `
  -SiteUrl "https://TENANT.sharepoint.com/sites/ZEF" `
  -SeedData
```

- Existing lists → skipped
- Existing columns → skipped
- Existing seed records → skipped
- **No records are deleted or overwritten**

---

## Troubleshooting

| Issue | Resolution |
|---|---|
| `An Entra Application (Client) ID is required` | Set `-ClientId` or `$env:ENTRA_CLIENT_ID` — do not use the Tenant ID |
| `ClientId matches the Tenant ID` | Use Application (client) ID from App registrations, not Directory (tenant) ID |
| `Invalid Entra Client ID format` | Use the Application (client) ID GUID from Entra ID |
| `Please specify a valid client id` / `Specified method is not supported` | Register an Entra app with redirect URI `http://localhost`; pass the real Application (client) ID |
| `PnP.PowerShell module is not installed` | Run `Install-Module PnP.PowerShell -Scope CurrentUser` |
| Access denied after sign-in | Grant admin consent on the app registration; ensure user is Site Owner |
| List exists but columns missing | Re-run the script — missing columns will be added |
| Seed records not appearing | Check for placeholder URLs; review script output for `[SKIP]` messages |
| Authentication loop | Clear PnP cache: `Disconnect-PnPOnline`; sign in with the correct tenant account |
| Wrong tenant | Disconnect and reconnect; verify the `-SiteUrl` hostname |

---

## Rollback Considerations

The provisioning script does **not** auto-rollback. To undo:

1. **Seed data only:** Delete individual list items manually from SharePoint
2. **Columns:** Delete custom columns manually (if not in use)
3. **Lists:** Delete entire lists from Site contents (destroys all list data)

Always run `-DryRun` first on production sites.

---

## After Provisioning

1. Replace placeholder URLs in SharePoint list items with real ZEF destinations
2. Add resource records with resolved links (or update seed file and re-run with real URLs)
3. Run validation: `.\scripts\validate-zef-sharepoint.ps1 -SiteUrl "..."`
4. Open the ZEF Digital Workplace page and run the **Production Smoke Test** in `DEPLOYMENT.md`
5. Review list permissions per `docs/ZEF-SHAREPOINT-DATA-GOVERNANCE.md`
6. Configure org-wide baseline site access per `docs/ZEF-BASELINE-ACCESS.md` (`scripts/apply-zef-baseline-access.ps1`)

---

*Scripts provision SharePoint structure only. They do not upload the SPFx package or approve Graph permissions.*
