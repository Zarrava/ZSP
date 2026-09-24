# ZEF Digital Workplace — Tenant Deployment Guide

This document describes how to deploy the **ZEF Digital Workplace** SharePoint Framework (SPFx) solution to the ZEF Microsoft 365 tenant.

**Solution:** `zef-digital-workplace`  
**SPFx version:** 1.23.2 (Heft-based build)  
**Package file:** `sharepoint/solution/zef-digital-workplace.sppkg`  
**Solution version:** 1.0.0.0

---

## Prerequisites

| Requirement | Details |
|---|---|
| Node.js | v22.23.2 (via nvm-windows recommended) |
| npm | 10.9.8 |
| Build tooling | Heft (`npm run build`) |
| Tenant role | SharePoint Administrator (App Catalog, API permissions) |
| Site role | Site Owner on the target SharePoint site |

---

## A. Build / Package Verification

Run these commands from the project root **before** uploading to the App Catalog:

```powershell
npm run build
npm run lint
npm run package-solution
```

Expected results:

- TypeScript: 0 errors
- ESLint: 0 errors
- Package: `sharepoint/solution/zef-digital-workplace.sppkg` created

Verify the package exists:

```
sharepoint/solution/zef-digital-workplace.sppkg
```

> **Note:** This project uses Heft, not Gulp. Do not use legacy `gulp bundle` / `gulp package-solution` commands.

---

## B. App Catalog Upload

1. Sign in to the **SharePoint Admin Center** as a SharePoint Administrator.
2. Navigate to **More features** → **Apps** → **Open** (App Catalog site), or go directly to your tenant App Catalog.
3. Open the **Apps for SharePoint** document library.
4. Upload `zef-digital-workplace.sppkg`.
5. When prompted, check **Make this solution available to all sites in the organization** (recommended when `skipFeatureDeployment` is enabled).
6. Click **Deploy**.

The solution metadata:

| Property | Value |
|---|---|
| Solution name | zef-digital-workplace-client-side-solution |
| Solution ID | `085ac811-6b60-4b52-ab2d-a1d706b87a06` |
| Version | 1.0.0.0 |

---

## C. App Installation / Deployment

Because `skipFeatureDeployment: true` is set, the app is available tenant-wide after App Catalog deployment.

On the **target SharePoint site**:

1. Go to **Site contents**.
2. Click **New** → **App**.
3. Find **zef-digital-workplace-client-side-solution** (or **ZEF Digital Workplace**).
4. Click **Add** to install the app on the site.

Alternatively, add the web part directly to a page — SharePoint will prompt to install the app if it is not yet installed on the site.

---

## D. API Permission Approval

After App Catalog upload, approve Microsoft Graph permissions.

1. Open **SharePoint Admin Center**.
2. Go to **Advanced** → **API access** (or **Access control** → **API access**, depending on admin center layout).
3. Locate pending requests for **zef-digital-workplace-client-side-solution**.
4. Approve **all five** delegated permissions:

| # | Permission | Purpose |
|---|---|---|
| 1 | `User.Read` | Current user profile and photo |
| 2 | `Calendars.Read` | Upcoming calendar events |
| 3 | `Team.ReadBasic.All` | User's joined Teams |
| 4 | `Files.Read` | OneDrive URL and recent documents |
| 5 | `Tasks.Read` | Microsoft To Do tasks summary |

> Permissions are **delegated** (run in the signed-in user's context). No application permissions are requested.

> Graph sections show graceful empty/error states until permissions are approved. The homepage does not crash if permissions are pending.

---

## E. Creation of the Three SharePoint Lists

Create these lists on the **same SharePoint site** where the web part will be hosted. The application reads lists from the current web via SPFx `WebPartContext` — no tenant URL is hard-coded.

| List name | Purpose |
|---|---|
| `ZEF Announcements` | Organization announcements |
| `ZEF Departments` | Department directory with site/Teams links |
| `ZEF Resources` | Resource links and documents |

List names are configurable in `src/config/defaultWorkplaceConfig.ts` but must match exactly unless configuration is updated and redeployed.

---

## F. Required Columns and Column Types

See **SharePoint List Configuration** (below) for the authoritative column specification used by the application.

---

## G. Populating the Lists

Use the seed data document for ready-to-enter records:

```
docs/ZEF-SHAREPOINT-DATA-SEED.md
```

Governance guidelines:

```
docs/ZEF-SHAREPOINT-DATA-GOVERNANCE.md
```

---

## Initial Production Data Setup

> **Automated option:** Use `scripts/provision-zef-sharepoint.ps1` to create lists, columns, and safe seed data automatically. See `docs/SHAREPOINT-PROVISIONING.md`.
>
> **PnP.PowerShell 3.4.1 authentication:** Interactive login requires an Entra **Application (Client) ID** from App registrations — **not** the Tenant/Directory ID (`607f8991-c6f3-4239-9bcf-31f33a5bf34d`). Provide `-ClientId` or set `$env:ENTRA_CLIENT_ID` before running provisioning scripts. Run `scripts/preflight-zef-sharepoint-auth.ps1` first. See `docs/SHAREPOINT-PROVISIONING.md` → **PnP.PowerShell Authentication / Entra App Registration**.

Follow these steps to configure live homepage data on the target ZEF SharePoint site.

1. **Open the target SharePoint site** where the ZEF Digital Workplace web part is installed.

2. **Create `ZEF Announcements`**
   - List type: Blank list (or Custom List)
   - Add columns: Body, Category, PublishedDate, Link, ExpiryDate, Priority

3. **Configure Announcements columns**
   - `Body` — Multiple lines of text (plain text acceptable)
   - `Category` — Single line of text
   - `PublishedDate` — Date and Time
   - `Link` — Hyperlink
   - `ExpiryDate` — Date and Time
   - `Priority` — Choice (`Normal`, `Important`, `Urgent`; default `Normal`)

4. **Create `ZEF Departments`**
   - Add columns: Description, SharePointSiteUrl, TeamsUrl, Icon, SortOrder

5. **Configure Departments columns**
   - `Description` — Single line of text
   - `SharePointSiteUrl` — Hyperlink
   - `TeamsUrl` — Hyperlink
   - `Icon` — Single line of text
   - `SortOrder` — Number

6. **Create `ZEF Resources`**
   - Add columns: Description, Link, Icon, ResourceCategory, Audience

7. **Configure Resources columns**
   - `Description` — Single line of text
   - `Link` — Hyperlink (required for each resource item)
   - `Icon` — Single line of text
   - `ResourceCategory` — Single line of text
   - `Audience` — Single line of text

8. **Populate each list** using the records in `docs/ZEF-SHAREPOINT-DATA-SEED.md`.

9. **Replace every placeholder URL** (`[INSERT ACTUAL URL]`, `[INSERT ACTUAL SHAREPOINT URL]`, `[INSERT ACTUAL TEAMS URL]`, `[INSERT ACTUAL ZEF URL]`) with the correct ZEF destination.

10. **Verify permissions** on all three lists. General users should read only content intended for them. Restrict edit access to Authorized List Managers and relevant owners (see `docs/ZEF-SHAREPOINT-DATA-GOVERNANCE.md`).

11. **Open the ZEF Digital Workplace page** on the target site.

12. **Verify live data** appears in Announcements, Departments, and Resources. Run the **Production Smoke Test** (below).

### Do Not Enter

The following must **not** be placed in the general homepage lists (`ZEF Announcements`, `ZEF Departments`, `ZEF Resources`):

- Confidential HR records (compensation, disciplinary, medical, performance reviews)
- Executive-private materials, schedules, or office communications
- Financial account details or unreleased fundraising data
- Personal employee or volunteer contact information without consent
- Security credentials or admin access details
- Legal privileged or pre-decision leadership content presented as final
- Any material that should be restricted to HR, Leadership, or Executive Assistant audiences

Sensitive content belongs in **permission-controlled SharePoint sites, libraries, or lists** — not the general homepage catalogues.

---

## H. Creating / Configuring the SharePoint Page

1. On the target site, create or edit a **modern SharePoint page** (e.g. `Home` or `Digital Workplace`).
2. Set the page layout to **Full width** for best results (optional).
3. Remove or reorder default web parts as needed.
4. Save as draft until testing is complete.

---

## I. Adding the ZEF Digital Workplace Web Part

1. Edit the target page.
2. Click **+** to add a web part.
3. Search for **ZefDigitalWorkplace** or **ZEF Digital Workplace**.
4. Add the web part to the page.
5. Expand the web part to full column width.
6. Publish the page.

The web part renders the homepage hierarchy:

Welcome → Quick Access → My Workspace → Announcements / Upcoming Events → Departments → Resources → Footer

---

## J. Testing Graph Functionality

Sign in as a standard ZEF user and verify:

| Section | Graph API | Expected behaviour |
|---|---|---|
| Header (user name/photo) | `/me`, `/me/photo/$value` | Shows signed-in user; initials fallback if no photo |
| Upcoming Events | `/me/events` | Shows next events or empty state |
| My Workspace — Teams | `/me/joinedTeams` | Shows team or empty state |
| My Workspace — Documents | `/me/drive/recent` | Shows recent file or empty state |
| My Workspace — Calendar | `/me/events` | Shows next event or empty state |
| My Workspace — Tasks | `/me/todo/lists` | Shows task count or empty state |
| Quick Access — Documents | `/me/drive` | Resolves OneDrive URL at runtime |

If Graph permissions are not yet approved, affected sections show empty/error states. Other sections continue working.

---

## K. Testing SharePoint REST Functionality

Verify list data loads from the current site:

| Section | List | Expected behaviour |
|---|---|---|
| Announcements | `ZEF Announcements` | Shows list items sorted by date |
| Departments | `ZEF Departments` | Shows departments sorted by SortOrder |
| Resources | `ZEF Resources` | Shows resource links |

If a list does not exist, the section shows an empty state — the homepage does not crash.

---

## L. Testing Permissions / Security

Confirm the following:

- [ ] General users see only content they are permitted to access via SharePoint list permissions
- [ ] No confidential HR, leadership, or executive information is in publicly readable list items
- [ ] EA Workspace department entry does not expose restricted executive content
- [ ] Graph data is scoped to the **signed-in user** (delegated permissions only)
- [ ] Role personalization is **disabled** in production (`personalizationEnabled: false`)
- [ ] Mock data is **not** used in production (only active when served from localhost)

---

## M. Production Verification

Final checks after deployment:

- [ ] Page loads without JavaScript errors (browser F12 console)
- [ ] User profile shows correct signed-in user
- [ ] All three SharePoint lists return data (or graceful empty states)
- [ ] Graph sections populate after API approval
- [ ] Department links navigate correctly (SharePoint site, Teams, or both)
- [ ] Quick Access links resolve (Teams, OneDrive/Documents, Calendar, Forms)
- [ ] No section failure crashes the entire homepage
- [ ] Mobile/narrow viewport renders acceptably

---

## N. Rollback Procedure

If deployment causes issues:

1. **Remove web part** from the affected page (edit page → delete web part → publish).
2. **Remove app from site:** Site contents → find the app → Remove.
3. **Retire package (optional):** App Catalog → Apps for SharePoint → remove or replace `zef-digital-workplace.sppkg`.
4. **Revoke API permissions (optional):** SharePoint Admin Center → API access → remove approved permissions for this solution.
5. **Restore previous page** from version history if the page layout was changed.

To deploy a previous package version, upload the older `.sppkg` to the App Catalog (increment or match version as appropriate).

---

## O. Troubleshooting

| Symptom | Likely cause | Resolution |
|---|---|---|
| Web part not in toolbox | App not deployed/installed | Upload to App Catalog; install app on site |
| "Quick access unavailable" | Graph/REST error | Check browser console; verify API permissions |
| Empty announcements | List missing or empty | Create `ZEF Announcements`; add items |
| Empty departments | List missing or empty | Create `ZEF Departments`; add items |
| Graph sections empty | Permissions not approved | Approve all 5 Graph permissions in Admin Center |
| User photo missing | No photo in Entra ID or permission pending | Expected fallback to initials avatar |
| Department link goes nowhere | No URL configured | Add SharePointSiteUrl and/or TeamsUrl |
| Old package still served | CDN/browser cache | Clear cache; confirm new `.sppkg` uploaded |
| Build fails locally | Node/npm PATH issue | Ensure nvm Node 22.23.2 is active (`C:\nvm4w\nodejs`) |

---

## SharePoint List Configuration

The application reads all three lists from the **current SharePoint site** via SPFx `WebPartContext`. List names and field internal names are defined in one place only:

```
src/config/defaultWorkplaceConfig.ts
```

Do not duplicate list names elsewhere in the codebase.

### ZEF Announcements

| Column | Internal name | Type | Required | Notes |
|---|---|---|---|---|
| Title | `Title` | Single line of text | Yes | Built-in |
| Body | `Body` | Multiple lines of text | No | Plain text acceptable |
| Category | `Category` | Single line of text | No | |
| Published Date | `PublishedDate` | Date and Time | No | Recommended; used for sorting |
| Link | `Link` | Hyperlink | No | REST returns `{ Url, Description }` object |
| Expiry Date | `ExpiryDate` | Date and Time | No | Expired items hidden after calendar day |
| Priority | `Priority` | Choice | No | Values: `Normal`, `Important`, `Urgent` (default: `Normal`) |

**Application behaviour:**
- Sorted newest first by `PublishedDate`
- Items with `ExpiryDate` before today are excluded
- Missing optional fields handled safely
- Empty list → empty section (no crash)
- Missing list → empty section (no crash)
- Temporary API failure → section error state (homepage continues)

### ZEF Departments

| Column | Internal name | Type | Required | Notes |
|---|---|---|---|---|
| Title | `Title` | Single line of text | Yes | Department name |
| Description | `Description` | Single line of text | No | |
| SharePoint Site URL | `SharePointSiteUrl` | Hyperlink | No | |
| Teams URL | `TeamsUrl` | Hyperlink | No | |
| Icon | `Icon` | Single line of text | No | Fluent UI icon name |
| Sort Order | `SortOrder` | Number | No | Ascending sort |

**Field mapping:**

| SharePoint field | Application property |
|---|---|
| `Title` | `name` |
| `Description` | `description` |
| `SharePointSiteUrl` | `sharePointSiteUrl` |
| `TeamsUrl` | `teamsUrl` |
| `Icon` | `iconName` |
| `SortOrder` | sort order |

**Link behaviour:** Card URL = `SharePointSiteUrl` if present, otherwise `TeamsUrl`. Supports SharePoint-only, Teams-only, both, or neither (static row).

### ZEF Resources

| Column | Internal name | Type | Required | Notes |
|---|---|---|---|---|
| Title | `Title` | Single line of text | Yes | |
| Description | `Description` | Single line of text | No | |
| Link | `Link` | Hyperlink | Yes | Required in list design; missing values render as non-clickable |
| Icon | `Icon` | Single line of text | No | |
| Resource Category | `ResourceCategory` | Single line of text | No | |
| Audience | `Audience` | Single line of text | No | |

**Application behaviour:**
- Missing/invalid links render as static text (no crash)
- Empty list → empty section
- API failure → section error state

### Hyperlink and DateTime handling

The SharePoint REST layer normalizes field values in `src/services/SharePoint/sharePointUtils.ts`:

- **Hyperlink fields** may be returned as a plain string or as `{ Url, Description }`. Both are supported.
- **DateTime fields** may be returned as ISO 8601 strings or OData `/Date(epoch)/` values. Both are supported.
- **Choice fields** (e.g. Priority) are returned as plain strings.

---

## Production Smoke Test

After creating and populating the three lists, verify the following on the **deployed SharePoint page** (not localhost):

| # | Test | Pass criteria |
|---|---|---|
| 1 | **Announcements appear** | Items from `ZEF Announcements` display in the Announcements section |
| 2 | **Expired announcements hidden** | An item with `ExpiryDate` before today does not appear |
| 3 | **Departments appear** | Items from `ZEF Departments` display, sorted by `SortOrder` |
| 4 | **Department links work** | SharePoint-only, Teams-only, and combined links open correctly |
| 5 | **Resources appear** | Items from `ZEF Resources` display with titles |
| 6 | **User profile works** | Header shows signed-in user name; photo or initials fallback |
| 7 | **Calendar works** | Upcoming Events and My Workspace calendar row show data or empty state |
| 8 | **Teams information works** | My Workspace Teams row shows joined team or empty state |
| 9 | **Documents work** | My Workspace Documents row and Quick Access Documents link work |
| 10 | **Tasks work** | My Workspace Tasks row shows count or empty state |
| 11 | **Isolated section failure** | If one section fails (e.g. rename a list temporarily), other sections continue working |

**How to test #11:** Temporarily rename one list (e.g. `ZEF Announcements` → `ZEF Announcements Test`). Reload the page. Confirm the Announcements section shows an empty or error state while Departments, Resources, Graph sections, and the header still render.

---

## Configuration Reference

Production configuration is centralized in:

```
src/config/defaultWorkplaceConfig.ts
```

Key settings:

| Setting | Production value | Notes |
|---|---|---|
| `useMockDataInLocalDev` | `true` | Mock data only when `isServedFromLocalhost` |
| List titles | `ZEF Announcements`, `ZEF Departments`, `ZEF Resources` | Must match SharePoint list names |
| Quick Access | Config-driven destinations | Documents URL derived from OneDrive at runtime |
| Role personalization | Disabled | Future phase |

---

## Final Deployment Checklist

- [ ] `npm run build` passes locally
- [ ] `npm run lint` passes locally
- [ ] `npm run package-solution` produces `zef-digital-workplace.sppkg`
- [ ] Package uploaded to App Catalog
- [ ] Solution deployed / made available to all sites
- [ ] App installed on target SharePoint site
- [ ] `User.Read` approved
- [ ] `Calendars.Read` approved
- [ ] `Team.ReadBasic.All` approved
- [ ] `Files.Read` approved
- [ ] `Tasks.Read` approved
- [ ] `ZEF Announcements` list created with columns
- [ ] `ZEF Departments` list created with columns
- [ ] `ZEF Resources` list created with columns
- [ ] Lists populated with ZEF content
- [ ] SharePoint page created/configured
- [ ] ZEF Digital Workplace web part added and published
- [ ] Graph sections verified
- [ ] SharePoint REST sections verified
- [ ] Security/permissions verified
- [ ] Production smoke test completed

---

*Document version: 1.0 — aligned with SPFx 1.23.2 / solution version 1.0.0.0*
