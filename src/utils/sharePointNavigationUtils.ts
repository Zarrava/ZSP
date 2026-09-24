export interface ISharePointNavigationNode {
  id: number;
  title: string;
  url: string;
}

/** Authoritative ZEF primary navigation labels (Quick Launch is the URL source). */
export const ZEF_PRIMARY_NAV_TITLES: readonly string[] = [
  'Home',
  'Who we are',
  "What's happening",
  'Resources'
];

export interface ISharePointNavigationNodeResponse {
  Id: number;
  Title: string;
  Url: string;
  IsVisible: boolean;
}

/**
 * Filters SharePoint structural navigation nodes to usable ZEF destinations.
 */
export const selectZefPrimaryNavigationItems = (
  items: ISharePointNavigationNode[]
): ISharePointNavigationNode[] => {
  const byTitle = new Map(
    items.map((item) => [item.title.trim().toLowerCase(), item])
  );

  return ZEF_PRIMARY_NAV_TITLES
    .map((title) => byTitle.get(title.toLowerCase()))
    .filter((item): item is ISharePointNavigationNode => !!item);
};

export const mapSharePointNavigationNodes = (
  nodes: ISharePointNavigationNodeResponse[]
): ISharePointNavigationNode[] => {
  return nodes
    .filter((node) => node.IsVisible !== false)
    .filter((node) => typeof node.Title === 'string' && node.Title.trim().length > 0)
    .filter((node) => typeof node.Url === 'string' && node.Url.trim().length > 0)
    .filter((node) => node.Title.trim().toLowerCase() !== 'recent')
    .map((node) => ({
      id: node.Id,
      title: node.Title.trim(),
      url: node.Url.trim()
    }));
};

export const resolveSharePointNavigationUrl = (
  url: string,
  webAbsoluteUrl: string
): string => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const origin = new URL(webAbsoluteUrl).origin;
  if (url.startsWith('/')) {
    return `${origin}${url}`;
  }

  const base = webAbsoluteUrl.replace(/\/$/, '');
  return `${base}/${url.replace(/^\//, '')}`;
};

const decodeNavigationPath = (pathname: string): string => {
  let decoded = pathname;

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

  return decoded
    .replace(/[\u2018\u2019\u02BC]/g, '\'')
    .replace(/\/+$/, '')
    .toLowerCase();
};

const navigationFileName = (url: URL): string => {
  const path = decodeNavigationPath(url.pathname);
  return path.split('/').pop() ?? '';
};

const isWebRoot = (url: URL, webAbsoluteUrl: string): boolean => {
  try {
    const web = new URL(webAbsoluteUrl);
    return decodeNavigationPath(url.pathname) === decodeNavigationPath(web.pathname);
  }
  catch {
    return false;
  }
};

/**
 * Maps a ZEF navigation URL to the page it represents.
 * OrganizationHome.aspx and the site root are both Home.
 */
const zefNavigationPageKey = (url: URL, webAbsoluteUrl: string): string => {
  const fileName = navigationFileName(url);

  if (
    fileName === 'organizationhome.aspx'
    || fileName === 'home.aspx'
    || isWebRoot(url, webAbsoluteUrl)
  ) {
    return 'home';
  }

  if (fileName === 'who-we-are.aspx') {
    return 'who-we-are';
  }

  if (fileName === 'what\'s-happening.aspx' || fileName === 'whats-happening.aspx') {
    return 'whats-happening';
  }

  if (fileName === 'find-it.aspx') {
    return 'resources';
  }

  return decodeNavigationPath(url.pathname);
};

export const isSharePointNavigationActive = (
  itemUrl: string,
  currentUrl: string,
  webAbsoluteUrl: string
): boolean => {
  try {
    const resolvedItem = new URL(resolveSharePointNavigationUrl(itemUrl, webAbsoluteUrl));
    const resolvedCurrent = new URL(currentUrl);

    return zefNavigationPageKey(resolvedItem, webAbsoluteUrl) === zefNavigationPageKey(resolvedCurrent, webAbsoluteUrl);
  }
  catch {
    return false;
  }
};
