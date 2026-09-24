import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { defaultWorkplaceConfig } from './defaultWorkplaceConfig';
import { IZefWorkplaceConfig } from './IZefWorkplaceConfig';
import {
  buildSharePointLibraryUrl,
  buildSharePointListAllItemsUrl
} from '../utils/navigationUtils';

export interface IWorkplaceConfigOverrides {
  useMockDataInLocalDev?: boolean;
}

const MICROSOFT_365_HELP_URL = 'https://support.microsoft.com/microsoft-365';

/**
 * Resolves the effective workplace configuration for the current session.
 * Derives tenant/site-specific navigation and footer URLs from SPFx context.
 */
export const resolveWorkplaceConfig = (
  context: WebPartContext,
  overrides?: IWorkplaceConfigOverrides
): IZefWorkplaceConfig => {
  const config: IZefWorkplaceConfig = {
    ...defaultWorkplaceConfig,
    sharePoint: { ...defaultWorkplaceConfig.sharePoint },
    quickAccess: {
      ...defaultWorkplaceConfig.quickAccess,
      destinations: defaultWorkplaceConfig.quickAccess.destinations.map((item) => ({ ...item }))
    },
    graph: {
      ...defaultWorkplaceConfig.graph,
      endpoints: { ...defaultWorkplaceConfig.graph.endpoints }
    },
    navigation: { ...defaultWorkplaceConfig.navigation },
    footer: {
      links: defaultWorkplaceConfig.footer.links.map((item) => ({ ...item }))
    },
    roles: {
      ...defaultWorkplaceConfig.roles,
      executiveAssistant: { ...defaultWorkplaceConfig.roles.executiveAssistant },
      roleGroupMappings: { ...defaultWorkplaceConfig.roles.roleGroupMappings }
    },
    futureConfigList: { ...defaultWorkplaceConfig.futureConfigList }
  };

  if (overrides?.useMockDataInLocalDev !== undefined) {
    config.useMockDataInLocalDev = overrides.useMockDataInLocalDev;
  }

  const webUrl = context.pageContext.web.absoluteUrl;
  const sharedDocumentsUrl = buildSharePointLibraryUrl(
    webUrl,
    config.quickAccess.sharedDocumentsLibraryName
  );

  config.navigation = {
    announcementsViewAllUrl: buildSharePointListAllItemsUrl(
      webUrl,
      config.sharePoint.announcements.listTitle
    ),
    eventsViewAllUrl: config.graph.calendarUrl,
    departmentsViewAllUrl: buildSharePointListAllItemsUrl(
      webUrl,
      config.sharePoint.departments.listTitle
    ),
    resourcesViewAllUrl: buildSharePointListAllItemsUrl(
      webUrl,
      config.sharePoint.resources.listTitle
    ),
    teamsUrl: 'https://teams.microsoft.com',
    documentsUrl: sharedDocumentsUrl
  };

  config.quickAccess.destinations = config.quickAccess.destinations.map((destination) => {
    if (destination.id === 'qa-sharepoint') {
      return { ...destination, url: webUrl };
    }
    if (destination.id === 'qa-documents' && !destination.url?.trim()) {
      return { ...destination, url: sharedDocumentsUrl };
    }
    return destination;
  });

  config.footer.links = [
    {
      id: 'footer-zef-site',
      label: 'ZEF SharePoint site',
      url: webUrl
    },
    {
      id: 'footer-m365-help',
      label: 'Microsoft 365 help',
      url: MICROSOFT_365_HELP_URL
    }
  ];

  if (config.futureConfigList.enabled) {
    // Placeholder — load and merge tenant overrides from SharePoint configuration list.
  }

  return config;
};
