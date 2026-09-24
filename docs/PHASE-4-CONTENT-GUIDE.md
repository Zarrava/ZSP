# ZEF Digital Workplace — Phase 4 Content Guide

Manual SharePoint content configuration for list managers.  
**Do not invent URLs.** Only publish links to confirmed destinations.

**Target site:** https://zurfteempowercare.sharepoint.com/sites/ZEF

---

## Departments (ZEF Departments)

The application enriches missing icons/descriptions from the in-app department catalog.  
SharePoint URLs must be entered manually when real destinations exist.

| SortOrder | Title | Icon | Description (SharePoint or catalog) | SharePointSiteUrl | TeamsUrl |
|---:|---|---|---|---|
| 1 | Human Resources | People | People operations, onboarding, policies, and employee support. | REQUIRES HUMAN INPUT | REQUIRES HUMAN INPUT |
| 2 | Technology & Product | DeveloperTools | Digital tools, product delivery, and technology support for ZEF. | REQUIRES HUMAN INPUT | REQUIRES HUMAN INPUT |
| 3 | Design | Design | Brand assets, visual identity, and design support for ZEF teams. | REQUIRES HUMAN INPUT | REQUIRES HUMAN INPUT |
| 4 | Content & Communication | EditMail | Messaging, copy, and organization-wide communications. | REQUIRES HUMAN INPUT | REQUIRES HUMAN INPUT |
| 5 | Social Media | Share | Social content planning, publishing, and channel coordination. | REQUIRES HUMAN INPUT | REQUIRES HUMAN INPUT |
| 6 | Programs & Outreach | Globe | Program delivery, community partnerships, and outreach initiatives. | REQUIRES HUMAN INPUT | REQUIRES HUMAN INPUT |
| 7 | Community Managers | PeopleCommunity | Volunteer engagement, retention, and community participation. | REQUIRES HUMAN INPUT | REQUIRES HUMAN INPUT |
| 8 | Fundraising & Development | Donate | Donor relations, campaigns, and development activities. | REQUIRES HUMAN INPUT | REQUIRES HUMAN INPUT |
| 9 | Executive Assistants | Contact | Executive support, coordination, and the dedicated EA workspace. | REQUIRES HUMAN INPUT | REQUIRES HUMAN INPUT |

Leave SharePointSiteUrl and/or TeamsUrl blank until confirmed. The UI hides missing actions automatically.

---

## Resources (ZEF Resources)

Supported categories include:

- Documents
- HR
- Policies
- Templates
- Training
- Technology
- Operations
- Communications
- General
- Brand
- Forms
- Guides

### Confirmed resources (safe to add now)

| Title | ResourceCategory | Audience | Icon | Link |
|---|---|---|---|---|
| Microsoft 365 help | Training | All staff | OfficeLogo | https://support.microsoft.com/microsoft-365 |
| Microsoft Teams help | Training | All staff | TeamsLogo | https://support.microsoft.com/teams |
| SharePoint help | Training | All staff | SharepointLogo | https://support.microsoft.com/sharepoint |

### Planned ZEF resources (add only when a real Link exists)

See the full checklist in `docs/ZEF-SHAREPOINT-DATA-SEED.md` under **Planned ZEF resources**.

The dashboard only displays resources with valid http(s) links. Empty categories are expected until ZEF documents and pages are published.

---

## Announcements (ZEF Announcements)

Recommended categories:

- General
- HR
- Technology
- Operations
- Training
- Events
- Community
- Leadership
- Important

Priority values: `Normal`, `Important`, `Urgent`

Publishing rules (already enforced in the app):

- PublishedDate must be today or earlier
- ExpiryDate hides the item after the expiry calendar day
- Invalid or placeholder Link values are ignored (announcement still displays without a fake link)

Confirmed announcement links:

- Welcome / Digital Workplace announcements may link to https://zurfteempowercare.sharepoint.com/sites/ZEF
- Informational announcements without a destination page should leave Link blank

---

## Manual update process (approved)

1. Review existing items in each SharePoint list on the ZEF site.
2. Add or update descriptions, icons, categories, and priorities in SharePoint.
3. Add SharePointSiteUrl / TeamsUrl / Resource Link values only after URLs are confirmed.
4. Do **not** run `provision-zef-sharepoint.ps1` against production unless explicitly approved for a controlled update.

---

## Application features (no SharePoint changes required)

- View all → real SharePoint list views and Outlook calendar
- Search → scoped to loaded announcements, departments, and resources
- Footer → ZEF site + Microsoft 365 help (derived from context / confirmed public URL)
- Quick Access → ZEF SharePoint site, Shared Documents, Teams, Calendar, Forms
