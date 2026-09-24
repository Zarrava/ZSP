# ZEF SharePoint Data Governance

Governance guidelines for the three production lists used by the ZEF Digital Workplace homepage.

These lists are **general organizational directories**. They are not secure repositories for confidential information.

---

## 1. Who should be allowed to create announcements

- **Authorized List Managers** designated by Leadership or Administration
- **Content & Communication** contributors when authorized to publish organization-wide messages
- **Technology** when publishing platform or digital workplace notices

General members and volunteers should **not** have create access to `ZEF Announcements` unless explicitly authorized.

---

## 2. Who should be allowed to edit announcements

- The original publisher or their delegate
- **Authorized List Managers**
- **Leadership** or **Administration** for organization-wide corrections
- **Content & Communication** for editorial updates when authorized

Use SharePoint version history. Avoid undocumented edits to published announcements.

---

## 3. Who should manage departments

- **Administration** (primary owner of `ZEF Departments`)
- **Technology** for technical maintenance of links and list structure
- **Leadership** approval for new departments or structural changes

Department records should only include departments officially recognized by ZEF. Do not add departments without organizational approval.

The **Executive Assistants** entry is the EA Workspace hub entry. It is managed by **Administration** in coordination with assigned Executive Assistants and relevant offices (COO, Lead Coordinator, Administration).

---

## 4. Who should manage resources

- **Administration** (overall catalogue owner)
- **HR** for HR-category resources approved for general access
- **Technology** for technology and Microsoft 365 resources
- **Design** for brand assets
- **Authorized List Managers** for cross-functional resources

Each resource owner should verify that links remain current.

---

## 5. Information that must never be placed in these public/general lists

Do **not** publish the following in `ZEF Announcements`, `ZEF Departments`, or `ZEF Resources`:

- Personal employee information (home addresses, personal phone numbers, private emails)
- Confidential HR records (disciplinary actions, compensation, medical information, performance reviews)
- Executive-private schedules, correspondence, or office materials
- Financial account details, donor private data, or unreleased fundraising figures
- Security credentials, internal system passwords, or admin access details
- Legal privileged material
- Unreleased leadership decisions presented as final before approval
- Volunteer or member private contact details without consent

If content is restricted to a specific role or office, it belongs in a **permission-controlled SharePoint site, library, or list** — not the general homepage lists.

---

## 6. How sensitive HR information should be handled

- HR maintains **self-sufficient HR resources** in HR-controlled SharePoint locations.
- Only HR-approved, **general-access** HR links may appear in `ZEF Resources`.
- Do not publish policy drafts, case details, or employee-specific information in homepage lists.
- Apply SharePoint permissions so HR libraries are readable only by authorized HR staff and relevant roles.

---

## 7. How leadership/executive information should be handled

- Leadership announcements on the homepage should contain only information approved for **organization-wide visibility**.
- Do not publish confidential executive briefings, internal leadership deliberations, or sensitive office communications.
- Calendar, document, and task details for leadership appear through **Microsoft Graph in the signed-in user's own workspace** — not through public list entries.

---

## 8. How EA information should be handled

- The **EA Workspace** is represented by the **Executive Assistants** department entry and future role-aware architecture.
- EA office-specific documents, calendars, and tasks belong in **office-specific, permission-controlled** SharePoint locations.
- Multiple Executive Assistants may support the same office (COO, Lead Coordinator, Administration, etc.).
- Do not expose confidential executive or HR information through the EA Workspace link or general homepage lists.
- EA list entries should contain only the **navigation link** to the EA workspace — not confidential content itself.

---

## 9. How expired announcements should be managed

The application automatically **hides announcements after their `ExpiryDate` calendar day**.

Governance process:

1. Set `ExpiryDate` when an announcement is time-bound.
2. Review `ZEF Announcements` periodically for outdated content.
3. Archive or delete expired items in SharePoint as part of regular content maintenance.
4. Do not rely on expiry alone for sensitive content removal — restrict at source if content was published in error.

---

## 10. How links should be validated

Before publishing or updating any hyperlink field (`Link`, `SharePointSiteUrl`, `TeamsUrl`):

1. Confirm the URL is the **correct ZEF destination**.
2. Open the link as a standard organization user (not only as admin).
3. Confirm the destination is accessible to the intended audience.
4. Prefer HTTPS URLs.
5. Use SharePoint site URLs for department sites and Teams URLs for Teams workspaces.
6. Remove or update broken links promptly.
7. Do not use personal OneDrive links for organization resources unless explicitly approved.

**Validation cadence:** Review links at least quarterly, and after any site or Teams restructuring.

---

## Role Summary

| Role | Typical responsibilities |
|---|---|
| **Leadership** | Approve organization-wide announcements and structural changes |
| **COO** | Approve operational announcements affecting multiple departments |
| **Lead Coordinator** | Coordinate cross-department operational communications |
| **HR** | Own HR resources; approve HR content in general lists |
| **Administration** | Own department and resource catalogues; manage list permissions |
| **Technology** | Maintain digital workplace links, list structure, and technical resources |
| **Authorized List Managers** | Day-to-day content publishing and link validation |

---

*Governance should be enforced through SharePoint list permissions, approval workflows (if configured), and organizational policy — not through application code.*
