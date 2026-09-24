import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { IZefWorkplaceConfig } from '../../config/IZefWorkplaceConfig';
import { IAnnouncementsFieldMapping } from '../../config/ISharePointListConfig';
import { IAnnouncement } from '../../models/Announcement';
import { IDepartment } from '../../models/Department';
import { IResource } from '../../models/Resource';
import { IQuickAccessItem } from '../../models/QuickAccessItem';
import { ISharePointDataService } from './ISharePointDataService';
import { mockAnnouncements } from '../../data/announcements';
import { mockDepartments } from '../../data/departments';
import { mockResources } from '../../data/resources';
import { mockQuickAccessItems } from '../../data/quickAccess';
import { enrichDepartment } from '../../utils/departmentCatalog';
import { IMicrosoftGraphService } from '../MicrosoftGraph/IMicrosoftGraphService';
import {
  buildListItemsUrl,
  compareAnnouncementPriority,
  fieldMappingValues,
  isSharePointItemExpired,
  isSharePointItemPublished,
  isSharePointListNotFound,
  resolveSharePointDate,
  resolveSharePointDateString,
  resolveSharePointNumber,
  resolveSharePointText,
  resolveSharePointUrlSafe,
  SharePointFieldValue
} from './sharePointUtils';

type SharePointListItem = Record<string, SharePointFieldValue>;

export class SharePointDataService implements ISharePointDataService {
  private readonly _webUrl: string;

  public constructor(
    private readonly _context: WebPartContext,
    private readonly _config: IZefWorkplaceConfig,
    private readonly _graphService: IMicrosoftGraphService,
    private readonly _useMockData: boolean
  ) {
    this._webUrl = this._context.pageContext.web.absoluteUrl;
  }

  public async getAnnouncements(): Promise<IAnnouncement[]> {
    if (this._useMockData) {
      return mockAnnouncements;
    }

    const listConfig = this._config.sharePoint.announcements;
    const fields = listConfig.fields;

    const items = await this._getListItems(listConfig.listTitle, fieldMappingValues(fields));

    return items
      .map((item) => this._mapAnnouncement(item, fields))
      .filter((item) => isSharePointItemPublished(item.publishedRaw))
      .filter((item) => !item.expiryRaw || !isSharePointItemExpired(item.expiryRaw))
      .sort((a, b) => {
        const priorityDiff = compareAnnouncementPriority(a.priority, b.priority);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return b.sortTimestamp - a.sortTimestamp;
      })
      .map(({ expiryRaw: _expiryRaw, publishedRaw: _publishedRaw, sortTimestamp: _sortTimestamp, ...announcement }) => announcement);
  }

  public async getDepartments(): Promise<IDepartment[]> {
    if (this._useMockData) {
      return mockDepartments.map((department) => enrichDepartment(department));
    }

    const listConfig = this._config.sharePoint.departments;
    const fields = listConfig.fields;

    const items = await this._getListItems(listConfig.listTitle, fieldMappingValues(fields));

    if (items.length === 0) {
      return [];
    }

    return items
      .sort((a, b) => {
        const sortA = resolveSharePointNumber(a[fields.sortOrder]) ?? 0;
        const sortB = resolveSharePointNumber(b[fields.sortOrder]) ?? 0;
        return sortA - sortB;
      })
      .map((item) => {
        const sharePointSiteUrl = resolveSharePointUrlSafe(item[fields.sharePointSiteUrl]);
        const teamsUrl = resolveSharePointUrlSafe(item[fields.teamsUrl]);
        const id = item.Id;
        return enrichDepartment({
          id: typeof id === 'number' ? `dept-${id}` : `dept-${String(id)}`,
          name: resolveSharePointText(item[fields.title]) || 'Department',
          description: resolveSharePointText(item[fields.description]) || '',
          sharePointSiteUrl,
          teamsUrl,
          url: sharePointSiteUrl || teamsUrl,
          iconName: resolveSharePointText(item[fields.icon])
        });
      });
  }

  public async getResources(): Promise<IResource[]> {
    if (this._useMockData) {
      return mockResources;
    }

    const listConfig = this._config.sharePoint.resources;
    const fields = listConfig.fields;

    const items = await this._getListItems(listConfig.listTitle, fieldMappingValues(fields));

    if (items.length === 0) {
      return [];
    }

    return items
      .map((item) => {
        const id = item.Id;
        return {
          id: typeof id === 'number' ? `res-${id}` : `res-${String(id)}`,
          title: resolveSharePointText(item[fields.title]) || 'Resource',
          description: resolveSharePointText(item[fields.description]),
          url: resolveSharePointUrlSafe(item[fields.link]),
          iconName: resolveSharePointText(item[fields.icon]),
          category: resolveSharePointText(item[fields.resourceCategory]),
          audience: resolveSharePointText(item[fields.audience])
        };
      })
      .filter((resource) => !!resource.url)
      .sort((a, b) => {
        const categoryA = (a.category || '').toLowerCase();
        const categoryB = (b.category || '').toLowerCase();
        if (categoryA !== categoryB) {
          return categoryA.localeCompare(categoryB);
        }
        return a.title.localeCompare(b.title);
      });
  }

  public async getQuickAccessItems(): Promise<IQuickAccessItem[]> {
    if (this._useMockData) {
      return mockQuickAccessItems;
    }

    const documentsUrl = await this._resolveDocumentsUrl();

    return this._config.quickAccess.destinations.map((destination) => ({
      id: destination.id,
      title: destination.title,
      description: destination.description,
      iconName: destination.iconName,
      url: destination.id === 'qa-documents'
        ? documentsUrl
        : destination.url
    }));
  }

  private async _resolveDocumentsUrl(): Promise<string> {
    const documentsDestination = this._config.quickAccess.destinations.find(
      (item) => item.id === 'qa-documents'
    );
    const configuredUrl = documentsDestination?.url?.trim();

    if (configuredUrl) {
      return configuredUrl;
    }

    const oneDriveUrl = this._config.graph.oneDriveUrl
      || await this._graphService.getOneDriveWebUrl();

    if (oneDriveUrl) {
      return oneDriveUrl;
    }

    const libraryName = this._config.quickAccess.sharedDocumentsLibraryName;
    return `${this._webUrl}/${encodeURI(libraryName)}`;
  }

  private async _getListItems(listTitle: string, selectFields: string[]): Promise<SharePointListItem[]> {
    const url = buildListItemsUrl(this._webUrl, listTitle, selectFields);

    const response: SPHttpClientResponse = await this._context.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (isSharePointListNotFound(response)) {
      throw new Error(`SharePoint list not found: ${listTitle}`);
    }

    if (!response.ok) {
      throw new Error(`SharePoint list request failed (${response.status}): ${listTitle}`);
    }

    const json = await response.json() as { value?: SharePointListItem[] };
    return json.value || [];
  }

  private _mapAnnouncement(
    item: SharePointListItem,
    fields: IAnnouncementsFieldMapping
  ): IAnnouncement & {
    expiryRaw?: SharePointFieldValue;
    publishedRaw?: SharePointFieldValue;
    sortTimestamp: number;
  } {
    const publishedRaw = item[fields.publishedDate];
    const publishedDate = resolveSharePointDate(publishedRaw);
    const id = item.Id;

    return {
      id: typeof id === 'number' ? `ann-${id}` : `ann-${String(id)}`,
      title: resolveSharePointText(item[fields.title]) || 'Announcement',
      summary: resolveSharePointText(item[fields.body]),
      category: resolveSharePointText(item[fields.category]),
      date: resolveSharePointDateString(publishedRaw)
        || new Date().toISOString().split('T')[0],
      priority: resolveSharePointText(item[fields.priority]),
      url: resolveSharePointUrlSafe(item[fields.link]),
      expiryRaw: item[fields.expiryDate],
      publishedRaw,
      sortTimestamp: publishedDate ? publishedDate.getTime() : 0
    };
  }
}
