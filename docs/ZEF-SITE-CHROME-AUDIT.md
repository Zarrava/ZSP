# ZEF Site Chrome — Phase 1 Audit Report

**Date:** 2026-09-21  
**Site:** https://zurfteempowercare.sharepoint.com/sites/ZEF  
**SPFx package (pre-change):** 1.0.6.0 (web part only)

---

## Layer ownership

| Layer | Owner | Current state |
|---|---|---|
| **Microsoft / M365 global header** (suite bar, app launcher, M365 search, settings, profile) | **Microsoft 365 platform** | Always rendered by SharePoint Online; not configurable per site via supported site settings |
| **ZEF SharePoint site header / navigation** | **SharePoint site configuration** + new **SPFx Application Customizer** | Communication site (`SITEPAGEPUBLISHING`); header layout **Compact / Strong**; Quick Launch navigation drives site links |
| **Digital Workplace header** | **SPFx web part (`Header.tsx`)** | Premium workspace toolbar (search + signed-in user); previously duplicated ZEF branding |

---

## What produces each layer

### 1. Microsoft global header (blue suite bar)

- Rendered by SharePoint Online as part of the M365 shell
- Includes app launcher, Microsoft search, settings, help, profile
- **Not** controlled by the ZEF SPFx web part
- **Not** removable through supported SharePoint site settings, themes, or header layout options

### 2. ZEF site header / navigation

- SharePoint modern header (`Get-PnPWebHeader`)
- Quick Launch structural navigation (`Get-PnPNavigationNode -Location QuickLaunch`)
- No custom SharePoint theme applied at audit time
- No logo configured (`SiteLogoUrl` empty)
- No SPFx Application Customizer registered before this work

**Audited Quick Launch destinations (preserved):**

| Title | URL |
|---|---|
| Home | `/sites/zef` |
| Who we are | `/sites/zef/SitePages/Who-we-are.aspx` |
| What's happening | `/sites/zef/SitePages/What's-happening.aspx` |
| Resources | `/sites/zef/SitePages/Find-it.aspx` |
| Recent | *(empty URL — excluded from ZEF navigation rendering)* |

**Digital Workplace page:** `OrganizationHome.aspx` (hosts ZEF Digital Workplace web part)

### 3. Digital Workplace SPFx application

- Web part only (`ZefDigitalWorkplaceWebPart`)
- No existing Application Customizer, Header/Footer extension, or tenant theme integration
- One-column page layout on `OrganizationHome.aspx`
- No legacy right-hand SharePoint sidebar on the Digital Workplace page

---

## Supported method for hiding global header

**Result: No official Microsoft API.**

Microsoft does **not** provide a supported site-level API to remove the M365 suite bar / global SharePoint header.

**v1.0.8.0 implementation:** intentional, isolated platform-DOM customization in `src/extensions/zefSiteNavigation/sharePointChrome.ts`:

- Scoped CSS injected only when `body.zef-chrome-hidden` is present
- Disabled automatically in SharePoint **edit mode**
- Selectors centralized for maintenance
- Does **not** hide page content, SPFx web parts, dialogs, modals, or authoring UI

Also applied:

- `Set-PnPWebHeader -HeaderLayout Minimal -HideSiteTitle` (supported SharePoint config)
- ZEF Application Customizer as the single visible navbar

---

## Supported method for redesigning ZEF site navigation

1. **Keep authoritative URLs in SharePoint Quick Launch** (supported navigation store)
2. **Register SPFx Application Customizer** (`ZefSiteNavigationApplicationCustomizer`) to render premium ZEF navigation from Quick Launch via REST
3. **Apply minimal SharePoint header** to avoid duplicate title/nav bars
4. **Add `Digital Workplace` Quick Launch entry** → `/SitePages/OrganizationHome.aspx` (existing page; not invented)
5. **Simplify web part header** to workspace controls only (search + user)

---

## Risks

| Risk | Mitigation |
|---|---|
| M365 suite bar remains visible | Document platform limitation; unify site + app layers visually |
| Application Customizer requires site registration after deploy | `scripts/register-zef-site-navigation.ps1` |
| SharePoint header markup changes over time | No DOM hacking; use Top placeholder + supported APIs only |
| Duplicate navigation if both SharePoint and web part render nav | Minimal header + simplified web part toolbar |
| Editors need SharePoint admin controls | No removal of edit gear / suite bar; Minimal header only |

---

## Recommended implementation

1. **Do not** attempt to hide Microsoft global header
2. Deploy **SPFx 1.0.7.0** with Application Customizer + simplified web part header
3. Run `scripts/apply-zef-site-chrome.ps1` (Minimal header + Digital Workplace nav node)
4. Run `scripts/register-zef-site-navigation.ps1` after App Catalog upgrade
5. Validate responsive navigation at 320–1920px+

---

*Audit performed read-only via `scripts/audit-zef-site-chrome.ps1` and live SharePoint navigation inspection.*
