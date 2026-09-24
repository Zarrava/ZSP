import { SPHttpClientResponse } from '@microsoft/sp-http';

export type SharePointHyperlinkValue =
  | { Url?: string; Description?: string }
  | { url?: string; description?: string };

export type SharePointFieldValue =
  | string
  | number
  | boolean
  | SharePointHyperlinkValue
  | undefined;

export const resolveSharePointUrl = (value: SharePointFieldValue): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value.trim() || undefined;
  }
  if (typeof value === 'object') {
    const hyperlink = value as { Url?: string; url?: string };
    const url = hyperlink.Url !== undefined ? hyperlink.Url : hyperlink.url;
    return url?.trim() || undefined;
  }
  return undefined;
};

/** Matches provisioning placeholder tokens such as `[INSERT ACTUAL URL]`. */
export const isSharePointPlaceholderValue = (value: string): boolean =>
  /\[INSERT/i.test(value.trim());

export const isValidSharePointUrl = (url: string | undefined): url is string => {
  if (!url) {
    return false;
  }

  const trimmed = url.trim();
  if (!trimmed || isSharePointPlaceholderValue(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/** Resolves a SharePoint hyperlink/text field to a usable URL, excluding placeholders. */
export const resolveSharePointUrlSafe = (value: SharePointFieldValue): string | undefined => {
  const url = resolveSharePointUrl(value);
  return isValidSharePointUrl(url) ? url : undefined;
};

/** Parses SharePoint DateTime values (ISO 8601 or OData `/Date(epoch)/`). */
export const resolveSharePointDate = (value: SharePointFieldValue): Date | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const odataMatch = /^\/Date\((-?\d+)\)\/$/.exec(trimmed);
    if (odataMatch) {
      const parsed = new Date(Number(odataMatch[1]));
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }

    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
};

/** Returns YYYY-MM-DD for display/sorting, or undefined when not parseable. */
export const resolveSharePointDateString = (value: SharePointFieldValue): string | undefined => {
  const parsed = resolveSharePointDate(value);
  if (!parsed) {
    return typeof value === 'string' && value.trim() ? value.split('T')[0] : undefined;
  }

  const year = parsed.getFullYear();
  const month = parsed.getMonth() + 1;
  const day = parsed.getDate();
  const monthText = month < 10 ? `0${month}` : String(month);
  const dayText = day < 10 ? `0${day}` : String(day);
  return `${year}-${monthText}-${dayText}`;
};

/**
 * Returns true when an ExpiryDate value is before today (local calendar day).
 * Items remain visible through the full expiry calendar day.
 */
export const isSharePointItemExpired = (
  value: SharePointFieldValue,
  now: Date = new Date()
): boolean => {
  const expiry = resolveSharePointDate(value);
  if (!expiry) {
    return false;
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryStart = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  return expiryStart < todayStart;
};

/**
 * Returns true when PublishedDate is today or earlier (local calendar day).
 * Items without a parseable date are treated as published.
 */
export const isSharePointItemPublished = (
  value: SharePointFieldValue,
  now: Date = new Date()
): boolean => {
  const published = resolveSharePointDate(value);
  if (!published) {
    return true;
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const publishedStart = new Date(
    published.getFullYear(),
    published.getMonth(),
    published.getDate()
  );
  return publishedStart <= todayStart;
};

const announcementPriorityRank = (priority?: string): number => {
  const normalized = (priority || 'Normal').trim().toLowerCase();
  if (normalized === 'urgent') {
    return 0;
  }
  if (normalized === 'important') {
    return 1;
  }
  return 2;
};

/** Sort Urgent before Important before Normal (ascending rank). */
export const compareAnnouncementPriority = (left?: string, right?: string): number =>
  announcementPriorityRank(left) - announcementPriorityRank(right);

export const resolveSharePointText = (value: SharePointFieldValue): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
};

export const resolveSharePointNumber = (value: SharePointFieldValue): number | undefined => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

export const isSharePointListNotFound = (response: SPHttpClientResponse): boolean =>
  response.status === 404;

export const isSharePointListMissingError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return /404|not found|does not exist/i.test(error.message);
};

export const fieldMappingValues = (fields: object): string[] => {
  const values: string[] = [];
  const record = fields as { [key: string]: string };
  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      values.push(record[key]);
    }
  }
  return values;
};

export const buildListItemsUrl = (
  webUrl: string,
  listTitle: string,
  selectFields: string[]
): string => {
  const uniqueFields: string[] = ['Id'];
  selectFields.forEach((field) => {
    if (uniqueFields.indexOf(field) === -1) {
      uniqueFields.push(field);
    }
  });
  const select = uniqueFields.join(',');
  return `${webUrl}/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')/items?$select=${select}&$top=100`;
};
