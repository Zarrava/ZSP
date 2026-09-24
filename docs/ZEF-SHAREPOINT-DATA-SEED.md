# ZEF SharePoint Data Seed

Ready-to-enter initial production data for the three ZEF Digital Workplace SharePoint lists.

**Target site:** https://zurfteempowercare.sharepoint.com/sites/ZEF

**Instructions:**
1. Create each list and its columns as documented in `DEPLOYMENT.md`.
2. Enter the records below.
3. Do not publish placeholder URLs — leave Link / SharePointSiteUrl / TeamsUrl blank when the destination is not yet confirmed.
4. Do not publish announcements that state unconfirmed events, policies, or deadlines.

---

## ZEF Announcements

Create the **Priority** column as a Choice field with values: `Normal`, `Important`, `Urgent` (default: `Normal`).

| # | Title | Body | Category | PublishedDate | Link | ExpiryDate | Priority |
|---|---|---|---|---|---|---|---|
| 1 | Welcome to the ZEF Digital Workplace | This homepage brings together announcements, departments, resources, and your Microsoft 365 workspace in one place. Check back here for organization updates. | General | 2026-09-19 | https://zurfteempowercare.sharepoint.com/sites/ZEF | | Normal |
| 2 | Digital Workplace now available on SharePoint | The ZEF Digital Workplace web part is available on the organization SharePoint site. Use it to navigate departments, resources, and your workspace. | Technology | 2026-09-19 | https://zurfteempowercare.sharepoint.com/sites/ZEF | | Important |
| 3 | SharePoint lists now being configured | Announcements, departments, and resources on this homepage are managed through dedicated SharePoint lists. Authorized list managers will keep content current. | Operations | 2026-09-19 | | 2026-12-31 | Normal |
| 4 | Volunteer engagement through General Discussions | Volunteer engagement continues through General Discussions. Community Managers support volunteer participation and retention. | Community | 2026-09-18 | | | Normal |
| 5 | Community Managers — Design graphics requests | Community Managers may request graphics support from Design when needed. This is optional and not a required publishing workflow. | Community | 2026-09-17 | | | Normal |
| 6 | HR resources available through the Resources section | HR maintains its own resources. Use the Resources section on this homepage for general HR links approved for broad access. | HR | 2026-09-16 | | | Normal |

**Notes for list managers:**
- Set `PublishedDate` to the date the announcement should appear.
- Use `ExpiryDate` when an announcement should automatically disappear after a calendar day.
- Leave `Link` blank if there is no destination page.
- Do not use `Urgent` unless the message requires immediate attention across the organization.
- Recommended categories: General, Operations, HR, Technology, Training, Events, Community, Leadership, Important.

---

## ZEF Departments

The **Executive Assistants** entry represents the dedicated **EA Workspace** hub. It appears in the department directory but links to the EA workspace destination when confirmed — not a generic department site.

Leave `SharePointSiteUrl` and/or `TeamsUrl` blank until a confirmed destination exists. The homepage hides missing actions automatically. The app also enriches icons and descriptions from its department catalog when SharePoint values are empty.

| SortOrder | Title | Description | SharePointSiteUrl | TeamsUrl | Icon |
|---|---|---|---|---|---|
| 1 | Human Resources | People operations, onboarding, policies, and employee support. | | | People |
| 2 | Technology & Product | Digital tools, product delivery, and technology support for ZEF. | | | DeveloperTools |
| 3 | Design | Brand assets, visual identity, and design support for ZEF teams. | | | Design |
| 4 | Content & Communication | Messaging, copy, and organization-wide communications. | | | EditMail |
| 5 | Social Media | Social content planning, publishing, and channel coordination. | | | Share |
| 6 | Programs & Outreach | Program delivery, community partnerships, and outreach initiatives. | | | Globe |
| 7 | Community Managers | Volunteer engagement, retention, and community participation. | | | PeopleCommunity |
| 8 | Fundraising & Development | Donor relations, campaigns, and development activities. | | | Donate |
| 9 | Executive Assistants | Executive support, coordination, and the dedicated EA workspace. | | | Contact |

**Link guidance:**
- A department may have a SharePoint site only, Teams only, or both.
- Do not link every department to the main ZEF site as a substitute for a real department destination.
- Add URLs only after the destination is confirmed in Microsoft 365.

---

## ZEF Resources

Each resource requires a **Link** (Hyperlink). Only rows with confirmed URLs are provisioned automatically.

### Confirmed resources (safe to provision)

| Title | Description | Link | Icon | ResourceCategory | Audience |
|---|---|---|---|---|---|
| Microsoft 365 help | Official Microsoft 365 training and help articles | https://support.microsoft.com/microsoft-365 | OfficeLogo | Training | All staff |
| Microsoft Teams help | Get started with Teams meetings, chat, and collaboration | https://support.microsoft.com/teams | TeamsLogo | Training | All staff |
| SharePoint help | Learn SharePoint sites, lists, and document libraries | https://support.microsoft.com/sharepoint | SharepointLogo | Training | All staff |

---

## Planned ZEF resources (manual checklist — not auto-provisioned)

Do **not** add these to SharePoint until the document or page URL is confirmed. Categories are suggested for when content becomes available.

| Title | ResourceCategory | Audience | Icon |
|---|---|---|---|
| Volunteer Handbook | Documents | Volunteers | BookAnswers |
| ZEF Organizational Overview | Documents | All staff | Info |
| ZEF Brand Guidelines | Documents | All staff | Design |
| Organizational Structure | Documents | All staff | Org |
| HR Resources | HR | All staff | People |
| Volunteer Onboarding Guide | HR | Volunteers | Education |
| Leave / Attendance guidance | HR | All staff | Calendar |
| Code of Conduct | Policies | All staff | ProtectedDocument |
| Privacy Policy | Policies | All staff | ProtectedDocument |
| Data Protection / Data Privacy Policy | Policies | All staff | ProtectedDocument |
| Communications Policy | Policies | All staff | EditMail |
| Acceptable Use Policy | Policies | All staff | ProtectedDocument |
| Information Security Policy | Policies | All staff | Shield |
| Meeting Agenda Template | Templates | All staff | FileTemplate |
| Meeting Minutes Template | Templates | All staff | FileTemplate |
| Project Brief Template | Templates | All staff | FileTemplate |
| Event Planning Template | Templates | All staff | Calendar |
| Content Request Template | Templates | All staff | EditMail |
| Design Request Template | Templates | All staff | Design |
| Leave Request Template | Templates | All staff | Calendar |
| Incident / Issue Reporting Template | Templates | All staff | Warning |
| Internal onboarding materials | Training | All staff | Education |

**Notes for list managers:**
- Use `Audience` to indicate intended readers (e.g. `All staff`, `Volunteers`, `Leadership`).
- Restrict sensitive resources through SharePoint list permissions rather than relying on the Audience column alone.
- Remove or update resources when links break or content is retired.

---

## Draft announcement template (manual use only)

Use this template when creating new announcements. **Do not provision this row as-is.**

| Title | Body | Category | PublishedDate | Link | ExpiryDate | Priority |
|---|---|---|---|---|---|---|
| [CONFIRM TITLE BEFORE PUBLISHING] | [CONFIRM BODY BEFORE PUBLISHING] | General | [YYYY-MM-DD] | | | Normal |

---

*Lists may be provisioned using `scripts/provision-zef-sharepoint.ps1` — see `docs/SHAREPOINT-PROVISIONING.md`. Review `docs/PHASE-4-CONTENT-GUIDE.md` before updating production list content.*
