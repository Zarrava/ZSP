import { IZefWorkplaceConfig } from '../config/IZefWorkplaceConfig';
import { IUserContextService } from './IUserContextService';
import { ISharePointDataService } from './SharePoint/ISharePointDataService';
import { IMicrosoftGraphService } from './MicrosoftGraph/IMicrosoftGraphService';

export interface IWorkplaceServices {
  config: IZefWorkplaceConfig;
  userContext: IUserContextService;
  sharePoint: ISharePointDataService;
  graph: IMicrosoftGraphService;
  isLocalDev: boolean;
}
