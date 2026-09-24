import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import {
  ISharePointNavigationNode,
  ISharePointNavigationNodeResponse,
  mapSharePointNavigationNodes
} from '../../../utils/sharePointNavigationUtils';

export class ZefSiteNavigationService {
  public constructor(
    private readonly spHttpClient: SPHttpClient,
    private readonly webAbsoluteUrl: string
  ) {}

  public async getQuickLaunchNavigation(): Promise<ISharePointNavigationNode[]> {
    const endpoint = `${this.webAbsoluteUrl.replace(/\/$/, '')}/_api/web/navigation/quicklaunch`;

    const response: SPHttpClientResponse = await this.spHttpClient.get(
      endpoint,
      SPHttpClient.configurations.v1,
      {
        headers: {
          Accept: 'application/json;odata=nometadata'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to load SharePoint navigation (${response.status})`);
    }

    const payload = await response.json() as { value?: ISharePointNavigationNodeResponse[] };
    return mapSharePointNavigationNodes(payload.value ?? []);
  }
}
