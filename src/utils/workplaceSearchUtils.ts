import { IAnnouncement } from '../models/Announcement';
import { IDepartment } from '../models/Department';
import { IResource } from '../models/Resource';

export type WorkplaceSearchResultType = 'announcement' | 'department' | 'resource';

export interface IWorkplaceSearchResult {
  id: string;
  type: WorkplaceSearchResultType;
  title: string;
  subtitle?: string;
  url?: string;
  sectionAnchor?: string;
}

export interface IWorkplaceSearchSource {
  announcements: IAnnouncement[];
  departments: IDepartment[];
  resources: IResource[];
}

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 12;

const includesQuery = (value: string | undefined, query: string): boolean =>
  !!value && value.toLowerCase().indexOf(query) !== -1;

const announcementMatches = (item: IAnnouncement, query: string): boolean =>
  includesQuery(item.title, query)
  || includesQuery(item.summary, query)
  || includesQuery(item.category, query);

const departmentMatches = (item: IDepartment, query: string): boolean =>
  includesQuery(item.name, query)
  || includesQuery(item.description, query);

const resourceMatches = (item: IResource, query: string): boolean =>
  includesQuery(item.title, query)
  || includesQuery(item.description, query)
  || includesQuery(item.category, query)
  || includesQuery(item.audience, query);

/**
 * Scoped search over live workplace data already loaded in the dashboard.
 * Does not query external indexes or return fabricated results.
 */
export const searchWorkplaceContent = (
  query: string,
  source: IWorkplaceSearchSource
): IWorkplaceSearchResult[] => {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const results: IWorkplaceSearchResult[] = [];

  source.announcements.forEach((announcement) => {
    if (!announcementMatches(announcement, normalized)) {
      return;
    }
    results.push({
      id: `search-ann-${announcement.id}`,
      type: 'announcement',
      title: announcement.title,
      subtitle: announcement.category,
      url: announcement.url,
      sectionAnchor: 'announcements-heading'
    });
  });

  source.departments.forEach((department) => {
    if (!departmentMatches(department, normalized)) {
      return;
    }
    results.push({
      id: `search-dept-${department.id}`,
      type: 'department',
      title: department.name,
      subtitle: department.description,
      url: department.sharePointSiteUrl || department.teamsUrl || department.url,
      sectionAnchor: 'departments-heading'
    });
  });

  source.resources.forEach((resource) => {
    if (!resourceMatches(resource, normalized)) {
      return;
    }
    results.push({
      id: `search-res-${resource.id}`,
      type: 'resource',
      title: resource.title,
      subtitle: resource.category,
      url: resource.url,
      sectionAnchor: 'resources-heading'
    });
  });

  return results.slice(0, MAX_RESULTS);
};

export const getWorkplaceSearchTypeLabel = (type: WorkplaceSearchResultType): string => {
  switch (type) {
    case 'announcement':
      return 'Announcement';
    case 'department':
      return 'Department';
    case 'resource':
      return 'Resource';
    default:
      return 'Result';
  }
};
