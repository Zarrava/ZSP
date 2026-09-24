import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { resolveWorkplaceConfig } from '../config/resolveWorkplaceConfig';
import { IWorkplaceServices } from './IWorkplaceServices';
import { UserContextService } from './UserContextService';
import { SharePointDataService } from './SharePoint/SharePointDataService';
import { MicrosoftGraphService } from './MicrosoftGraph/MicrosoftGraphService';

export class ServiceFactory {
  public static create(context: WebPartContext): IWorkplaceServices {
    const config = resolveWorkplaceConfig(context);
    const isLocalDev = context.isServedFromLocalhost;
    const useMockData = isLocalDev && config.useMockDataInLocalDev;

    const graph = new MicrosoftGraphService(context, config);
    const sharePoint = new SharePointDataService(context, config, graph, useMockData);
    const userContext = new UserContextService(context, graph, config);

    return {
      config,
      userContext,
      sharePoint,
      graph,
      isLocalDev
    };
  }
}
