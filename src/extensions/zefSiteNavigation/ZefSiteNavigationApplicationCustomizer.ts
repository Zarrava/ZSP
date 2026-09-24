import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';

import { ZefSiteNavigation } from './components/ZefSiteNavigation';
import { ZefSiteNavigationService } from './services/ZefSiteNavigationService';
import {
  ISharePointNavigationNode,
  selectZefPrimaryNavigationItems
} from '../../utils/sharePointNavigationUtils';
import {
  createSharePointChromeController,
  ISharePointChromeController
} from './sharePointChrome';

const LOG_SOURCE: string = 'ZefSiteNavigationApplicationCustomizer';

export interface IZefSiteNavigationApplicationCustomizerProperties {
  /** Reserved for future property-pane configuration. */
}

export default class ZefSiteNavigationApplicationCustomizer
  extends BaseApplicationCustomizer<IZefSiteNavigationApplicationCustomizerProperties> {

  private _topPlaceholder: PlaceholderContent | undefined;
  private _navigationItems: ISharePointNavigationNode[] = [];
  private _isLoading: boolean = true;
  private _errorMessage: string | undefined;
  private _chromeController: ISharePointChromeController | undefined;

  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized ZEF site navigation extension');

    this._initializeChromeHiding();
    this._registerPlaceholderRendering();
    await this._loadNavigationItems();

    return Promise.resolve();
  }

  public onDispose(): void {
    try {
      this._chromeController?.dispose();
    }
    catch (error) {
      Log.error(LOG_SOURCE, error as Error);
    }
    finally {
      this._chromeController = undefined;
    }

    if (this._topPlaceholder) {
      try {
        this._topPlaceholder.dispose();
      }
      catch (error) {
        Log.error(LOG_SOURCE, error as Error);
      }
    }
  }

  private _initializeChromeHiding(): void {
    try {
      this._chromeController = createSharePointChromeController();
      this._chromeController.refresh();
    }
    catch (error) {
      Log.error(LOG_SOURCE, error as Error);
      this._chromeController = undefined;
    }
  }

  private _registerPlaceholderRendering(): void {
    try {
      this.context.placeholderProvider.changedEvent.add(this, this._renderNavigation);
      this._renderNavigation();
    }
    catch (error) {
      Log.error(LOG_SOURCE, error as Error);
    }
  }

  private async _loadNavigationItems(): Promise<void> {
    try {
      const service = new ZefSiteNavigationService(
        this.context.spHttpClient,
        this.context.pageContext.web.absoluteUrl
      );
      const quickLaunchItems = await service.getQuickLaunchNavigation();
      this._navigationItems = selectZefPrimaryNavigationItems(quickLaunchItems);
      this._errorMessage = undefined;
    }
    catch (error) {
      Log.error(LOG_SOURCE, error as Error);
      this._errorMessage = 'Navigation is temporarily unavailable.';
    }
    finally {
      this._isLoading = false;
      this._renderNavigation();
    }
  }

  private _buildUserPhotoUrl(email: string | undefined): string | undefined {
    if (!email) {
      return undefined;
    }

    try {
      const webUrl = this.context.pageContext.web.absoluteUrl.replace(/\/$/, '');
      return `${webUrl}/_layouts/15/userphoto.aspx?size=S&username=${encodeURIComponent(email)}`;
    }
    catch (error) {
      Log.error(LOG_SOURCE, error as Error);
      return undefined;
    }
  }

  private _renderNavigation = (): void => {
    try {
      if (!this._topPlaceholder) {
        this._topPlaceholder = this.context.placeholderProvider.tryCreateContent(
          PlaceholderName.Top,
          {
            onDispose: (placeholder: PlaceholderContent) => {
              try {
                ReactDom.unmountComponentAtNode(placeholder.domElement);
              }
              catch (error) {
                Log.error(LOG_SOURCE, error as Error);
              }
            }
          }
        );
      }

      if (!this._topPlaceholder) {
        return;
      }

      const user = this.context.pageContext.user;
      const email = user.email || user.loginName;

      const element = React.createElement(ZefSiteNavigation, {
        siteTitle: this.context.pageContext.web.title,
        webAbsoluteUrl: this.context.pageContext.web.absoluteUrl,
        currentUrl: window.location.href,
        items: this._navigationItems,
        userProfile: {
          displayName: user.displayName,
          email,
          photoUrl: this._buildUserPhotoUrl(email)
        },
        isLoading: this._isLoading,
        errorMessage: this._errorMessage
      });

      ReactDom.render(element, this._topPlaceholder.domElement);
      this._refreshChromeHiding();
    }
    catch (error) {
      Log.error(LOG_SOURCE, error as Error);
    }
  };

  private _refreshChromeHiding(): void {
    try {
      this._chromeController?.refresh();
    }
    catch (error) {
      Log.error(LOG_SOURCE, error as Error);
    }
  }
}

