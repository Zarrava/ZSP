import { IDepartment } from '../models/Department';

export interface IDepartmentCatalogEntry {
  iconName: string;
  description: string;
}

/**
 * Canonical ZEF department metadata.
 * Icons are Fluent UI 8 icon names available in @fluentui/react.
 * Descriptions apply when SharePoint Description is empty.
 */
export const DEPARTMENT_CATALOG: Record<string, IDepartmentCatalogEntry> = {
  'Human Resources': {
    iconName: 'People',
    description: 'People operations, onboarding, policies, and employee support.'
  },
  'Technology & Product': {
    iconName: 'DeveloperTools',
    description: 'Digital tools, product delivery, and technology support for ZEF.'
  },
  'Design': {
    iconName: 'Design',
    description: 'Brand assets, visual identity, and design support for ZEF teams.'
  },
  'Content & Communication': {
    iconName: 'EditMail',
    description: 'Messaging, copy, and organization-wide communications.'
  },
  'Social Media': {
    iconName: 'Share',
    description: 'Social content planning, publishing, and channel coordination.'
  },
  'Programs & Outreach': {
    iconName: 'Globe',
    description: 'Program delivery, community partnerships, and outreach initiatives.'
  },
  'Community Managers': {
    iconName: 'PeopleCommunity',
    description: 'Volunteer engagement, retention, and community participation.'
  },
  'Fundraising & Development': {
    iconName: 'Donate',
    description: 'Donor relations, campaigns, and development activities.'
  },
  'Executive Assistants': {
    iconName: 'Contact',
    description: 'Executive support, coordination, and the dedicated EA workspace.'
  }
};

export const getDepartmentCatalogEntry = (departmentName: string): IDepartmentCatalogEntry | undefined =>
  DEPARTMENT_CATALOG[departmentName.trim()];

export const getDepartmentIconName = (departmentName: string, iconFromSharePoint?: string): string | undefined => {
  const trimmed = iconFromSharePoint?.trim();
  if (trimmed) {
    return trimmed;
  }
  return getDepartmentCatalogEntry(departmentName)?.iconName;
};

export const enrichDepartment = (department: IDepartment): IDepartment => {
  const catalog = getDepartmentCatalogEntry(department.name);
  const description = department.description?.trim()
    ? department.description
    : catalog?.description || department.description;

  return {
    ...department,
    description: description || '',
    iconName: getDepartmentIconName(department.name, department.iconName)
  };
};
