export type SitePageExperienceMode =
  | 'auto'
  | 'organizationHome'
  | 'whoWeAre'
  | 'whatsHappening'
  | 'resources';

export type ResolvedSitePageExperience = Exclude<SitePageExperienceMode, 'auto'>;

const HOME_EXPERIENCE: ResolvedSitePageExperience = 'organizationHome';

/**
 * Case-insensitive lookup. Legacy kebab-case values from earlier packages
 * map to the same experiences so a previously saved override is still honored.
 */
const EXPERIENCE_MODE_ALIASES: Readonly<Record<string, SitePageExperienceMode>> = {
  auto: 'auto',
  organizationhome: 'organizationHome',
  whoweare: 'whoWeAre',
  whatshappening: 'whatsHappening',
  resources: 'resources',
  'digital-workplace': 'organizationHome',
  'who-we-are': 'whoWeAre',
  'whats-happening': 'whatsHappening'
};

const PAGE_FILE_EXPERIENCE: Readonly<Record<string, ResolvedSitePageExperience>> = {
  'organizationhome.aspx': 'organizationHome',
  'who-we-are.aspx': 'whoWeAre',
  'what\'s-happening.aspx': 'whatsHappening',
  'whats-happening.aspx': 'whatsHappening',
  'find-it.aspx': 'resources'
};

/**
 * Missing, empty, whitespace, and unrecognized values are Auto.
 * Existing web-part instances that never saved experienceMode therefore keep working.
 */
export const normalizeExperienceMode = (experienceMode: unknown): SitePageExperienceMode => {
  if (typeof experienceMode !== 'string') {
    return 'auto';
  }

  const key = experienceMode.trim().toLowerCase();
  return EXPERIENCE_MODE_ALIASES[key] ?? 'auto';
};

const decodePathSegment = (value: string): string => {
  let decoded = value;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        break;
      }
      decoded = next;
    }
    catch {
      break;
    }
  }

  return decoded;
};

/**
 * Page filename from a SharePoint location.
 * Query strings, hashes, and trailing slashes are ignored. The path is decoded first
 * so What%27s-happening.aspx matches What's-happening.aspx.
 */
export const getZefPageFileName = (pathname: string | undefined): string => {
  if (!pathname) {
    return '';
  }

  const withoutHash = pathname.split('#')[0] ?? '';
  const withoutQuery = withoutHash.split('?')[0] ?? '';
  const decoded = decodePathSegment(withoutQuery)
    .replace(/\\/g, '/')
    .replace(/[\u2018\u2019\u02BC]/g, '\'');
  const trimmed = decoded.replace(/\/+$/, '');
  const pageName = trimmed.split('/').pop() ?? '';

  return pageName.toLowerCase();
};

/**
 * Resolves a ZEF page experience from a SharePoint pathname.
 * An unrecognized page falls back to the Digital Workplace homepage.
 * This function never returns undefined.
 */
export const resolveZefSitePage = (pathname?: string): ResolvedSitePageExperience => {
  const locationPath = pathname !== undefined
    ? pathname
    : (typeof window !== 'undefined' ? window.location.pathname : '');

  try {
    const pageName = getZefPageFileName(locationPath);
    return (pageName && PAGE_FILE_EXPERIENCE[pageName]) || HOME_EXPERIENCE;
  }
  catch {
    return HOME_EXPERIENCE;
  }
};

export const getZefPageExperienceFromLocation = (
  pathname?: string
): ResolvedSitePageExperience => resolveZefSitePage(pathname);

export const resolveSitePageExperience = (
  pathname?: string
): ResolvedSitePageExperience => resolveZefSitePage(pathname);

export const resolveConfiguredSitePageExperience = (
  experienceMode: unknown,
  pathname?: string
): ResolvedSitePageExperience => {
  const mode = normalizeExperienceMode(experienceMode);

  if (mode === 'auto') {
    return resolveZefSitePage(pathname);
  }

  return mode;
};
