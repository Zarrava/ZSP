import { ZEF_SITE_URLS } from './zefSiteNavigationUrls';

export const ZEF_ORGANIZATION_NAME = 'Zurfte Empowercare Foundation';
export const ZEF_SHORT_NAME = 'ZEF';

/**
 * Established Zurfte Empowercare Foundation organization statements.
 * Focus areas without a separate source description use ZEF_DETAIL_PENDING.
 * Do not add statistics, partnerships, programs, or achievements here.
 */
export const ZEF_ORGANIZATION_INTRO =
  'Zurfte Empowercare Foundation empowers young people and underserved communities through education, entrepreneurship, mentorship, innovation, community development, and opportunity creation.';

export const ZEF_ABOUT_STATEMENT =
  'Zurfte Empowercare Foundation is a nonprofit focused on young people and underserved communities. It exists to empower them through education, entrepreneurship, mentorship, innovation, community development, and opportunity creation.';

export const ZEF_DIGITAL_WORKPLACE_INTRO =
  'The ZEF Digital Workplace homepage brings together announcements, departments, resources, and your Microsoft 365 workspace in one place.';

export const ZEF_MISSION_STATEMENT =
  'To empower young people and underserved communities through education, entrepreneurship, mentorship, innovation, community development, and opportunity creation.';

/** Used when a section has no further verified description in the repository. */
export const ZEF_DETAIL_PENDING =
  'Information will be published here as this area develops.';

export interface IZefFocusArea {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

/** Established Zurfte Empowercare Foundation focus areas. */
export const ZEF_CORE_FOCUS_AREAS: readonly IZefFocusArea[] = [
  {
    id: 'digital-skills',
    title: 'Digital Skills Development',
    description: ZEF_DETAIL_PENDING,
    iconName: 'DeveloperTools'
  },
  {
    id: 'entrepreneurship',
    title: 'Entrepreneurship',
    description: ZEF_DETAIL_PENDING,
    iconName: 'Lightbulb'
  },
  {
    id: 'mentorship',
    title: 'Mentorship',
    description: ZEF_DETAIL_PENDING,
    iconName: 'PeopleCommunity'
  },
  {
    id: 'innovation',
    title: 'Innovation & Technology',
    description: ZEF_DETAIL_PENDING,
    iconName: 'Rocket'
  },
  {
    id: 'community-development',
    title: 'Community Development',
    description: ZEF_DETAIL_PENDING,
    iconName: 'Globe'
  },
  {
    id: 'opportunity-creation',
    title: 'Opportunity Creation',
    description: ZEF_DETAIL_PENDING,
    iconName: 'Donate'
  }
];

export interface IZefOrganizationalArm {
  id: string;
  title: string;
  description: string;
  highlights: readonly string[];
}

export const ZEF_ORGANIZATIONAL_ARMS: readonly IZefOrganizationalArm[] = [
  {
    id: 'social-impact',
    title: 'Social Impact & Community Development',
    description: 'Programs & Outreach: Program delivery, community partnerships, and outreach initiatives. Community Managers: Volunteer engagement, retention, and community participation. Fundraising & Development: Donor relations, campaigns, and development activities.',
    highlights: [
      'Programs & Outreach',
      'Community Managers',
      'Fundraising & Development'
    ]
  },
  {
    id: 'innovation-technology',
    title: 'Innovation, Technology & Solutions Development',
    description: 'Technology & Product: Digital tools, product delivery, and technology support for ZEF. Design: Brand assets, visual identity, and design support for ZEF teams. Content & Communication: Messaging, copy, and organization-wide communications.',
    highlights: [
      'Technology & Product',
      'Design',
      'Content & Communication'
    ]
  }
];

export interface IZefCtaLink {
  label: string;
  url: string;
  description?: string;
}

export const ZEF_WHO_WE_ARE_CTAS: readonly IZefCtaLink[] = [
  {
    label: 'Zurfte Empowercare Foundation home',
    url: ZEF_SITE_URLS.digitalWorkplace,
    description: 'Open the organization home for Zurfte Empowercare Foundation.'
  }
];

