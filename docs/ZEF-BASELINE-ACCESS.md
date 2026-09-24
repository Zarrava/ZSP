# ZEF Digital Workplace — Baseline Access Model

This document describes how authenticated ZEF staff reach the Digital Workplace without requesting site access, while department-specific and restricted content remains permission-controlled elsewhere.

**Production site:** https://zurfteempowercare.sharepoint.com/sites/ZEF  
**Homepage:** `OrganizationHome.aspx`

---

## Goal

| Requirement | Implementation |
|---|---|
| All internal `@zurfteempowercare.org` M365 users can open the Digital Workplace | **Everyone except external users** in the site **Visitors** group (Read) |
| No per-user site access requests | Org-wide claim group grants access automatically for licensed internal users |
| Department / role restrictions apply after entry | Department SharePoint sites and permission-controlled libraries keep their own access |
| External accounts must not gain access from a link alone | Site **SharingCapability: Disabled**; externals are excluded from the org-wide claim group |

---

## Permission layers

```text
┌─────────────────────────────────────────────────────────────┐
│  ZEF Digital Workplace site (/sites/ZEF)                    │
│  Visitors: Everyone except external users → Read            │
│  Members: Authorized publishers only → Edit                 │
│  Owners: Site administrators → Full Control                 │
├─────────────────────────────────────────────────────────────┤
│  Homepage lists (inherit site Read)                         │
│  • ZEF Announcements                                        │
│  • ZEF Departments  (directory links only)                  │
│  • ZEF Resources                                            │
├─────────────────────────────────────────────────────────────┤
│  Department / restricted destinations (separate sites)    │
│  • HR, Leadership, EA Workspace, etc.                       │
│  • Each site/library/list maintains its own permissions     │
└─────────────────────────────────────────────────────────────┘
```

The homepage is a **general organizational directory**. Sensitive material stays in downstream SharePoint locations with unique permissions — see `docs/ZEF-SHAREPOINT-DATA-GOVERNANCE.md`.

---

## Why "Everyone except external users"

Microsoft SharePoint provides a built-in claim group that includes **all internal users in the tenant** and **excludes guest/external accounts**. This is the standard intranet baseline pattern because:

- New `@zurfteempowercare.org` users receive access automatically when assigned a Microsoft 365 license
- No manual group maintenance or access-request workflow is required
- Guest and external identities are not members of this claim group
- Site **Visitors** (Read) is the least-privilege site role suitable for homepage consumption

**Members** (Edit) remains limited to Authorized List Managers and site contributors who publish announcements, departments, and resources.

---

## External access guardrails

| Control | Current ZEF setting |
|---|---|
| Site collection sharing | **Disabled** — sharing links cannot grant anonymous or external access to this site |
| Baseline principal | **Everyone except external users** — guests are not included |
| Tenant sharing | External sharing may be enabled tenant-wide for other workloads; this site remains closed |

Guests who need collaboration belong on **department sites** or Teams with explicit invitation — not on the org-wide Digital Workplace baseline.

---

## Audit and apply scripts

Read-only audit:

```powershell
.\scripts\audit-zef-sharepoint-permissions.ps1 `
  -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
  -ClientId $env:ENTRA_CLIENT_ID
```

Dry run:

```powershell
.\scripts\apply-zef-baseline-access.ps1 `
  -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
  -ClientId $env:ENTRA_CLIENT_ID `
  -DryRun
```

Apply:

```powershell
.\scripts\apply-zef-baseline-access.ps1 `
  -SiteUrl "https://zurfteempowercare.sharepoint.com/sites/ZEF" `
  -ClientId $env:ENTRA_CLIENT_ID
```

Outputs are written to `scripts/output/zef-permission-audit.json` and `scripts/output/zef-baseline-access-result.json`.

---

## Post-implementation verification

Test as a standard `@zurfteempowercare.org` user who is **not** in Owners or Members:

1. Open https://zurfteempowercare.sharepoint.com/sites/ZEF/SitePages/OrganizationHome.aspx
2. Confirm the ZEF Digital Workplace loads without an access request prompt
3. Confirm announcements, departments, and resources are visible
4. Open a department destination the user is **not** authorized for — access should be denied or limited at that destination
5. Confirm a guest/external account cannot open the site without explicit invitation elsewhere

---

## Restricting homepage list content (optional)

The three homepage lists currently inherit site permissions. To hide specific list content from general staff while keeping the site open:

1. Break inheritance on the list (or library)
2. Grant Read to the appropriate department or role group
3. Do **not** grant general Visitors Read on that list

This preserves baseline site entry while tightening individual catalogues when needed.

---

*Baseline access is enforced in SharePoint — not in application code. Department permissions are enforced on destination sites and permission-controlled lists.*
