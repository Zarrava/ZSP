import { IFutureConfigListConfig } from './IFutureConfigListConfig';
import { IGraphConfig } from './IGraphConfig';
import { IQuickAccessConfig } from './IQuickAccessConfig';
import { IRoleAwareConfig } from './IRoleAwareConfig';
import { ISharePointListsConfig } from './ISharePointListConfig';
import { ILinkItem } from '../models/LinkItem';

export interface IWorkplaceNavigationConfig {
  announcementsViewAllUrl?: string;
  eventsViewAllUrl?: string;
  departmentsViewAllUrl?: string;
  resourcesViewAllUrl?: string;
  teamsUrl?: string;
  documentsUrl?: string;
}

export interface IWorkplaceFooterConfig {
  links: ILinkItem[];
}

/**
 * Tenant-level configuration for the ZEF Digital Workplace.
 * All list names, field mappings, and M365 destinations are centralized here.
 */
export interface IZefWorkplaceConfig {
  /** Use isolated mock data when running on localhost (development only). */
  useMockDataInLocalDev: boolean;

  sharePoint: ISharePointListsConfig;
  quickAccess: IQuickAccessConfig;
  graph: IGraphConfig;
  navigation: IWorkplaceNavigationConfig;
  footer: IWorkplaceFooterConfig;
  roles: IRoleAwareConfig;
  futureConfigList: IFutureConfigListConfig;
}
