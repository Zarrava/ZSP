import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'ZefDigitalWorkplaceWebPartStrings';
import ZefDigitalWorkplace from './components/ZefDigitalWorkplace';
import { IZefDigitalWorkplaceProps } from './components/IZefDigitalWorkplaceProps';
import { ServiceFactory } from '../../services/ServiceFactory';
import { IWorkplaceServices } from '../../services/IWorkplaceServices';
import { normalizeExperienceMode } from '../../utils/sitePageUtils';

export interface IZefDigitalWorkplaceWebPartProps {
  description: string;
  /**
   * Optional. Omitted on web parts created before this property existed.
   * Undefined, empty, and invalid values behave as Auto.
   */
  experienceMode?: string;
}

export default class ZefDigitalWorkplaceWebPart extends BaseClientSideWebPart<IZefDigitalWorkplaceWebPartProps> {

  private _services: IWorkplaceServices | undefined;

  public render(): void {
    if (!this._services) {
      this._services = ServiceFactory.create(this.context);
    }

    const element: React.ReactElement<IZefDigitalWorkplaceProps> = React.createElement(
      ZefDigitalWorkplace,
      {
        services: this._services,
        experienceMode: normalizeExperienceMode(this.properties.experienceMode),
        pagePath: window.location.pathname
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    this._services = ServiceFactory.create(this.context);
    return Promise.resolve();
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneDropdown('experienceMode', {
                  label: strings.ExperienceModeFieldLabel,
                  options: [
                    { key: 'auto', text: strings.ExperienceModeAuto },
                    { key: 'organizationHome', text: strings.ExperienceModeDigitalWorkplace },
                    { key: 'whoWeAre', text: strings.ExperienceModeWhoWeAre },
                    { key: 'whatsHappening', text: strings.ExperienceModeWhatsHappening },
                    { key: 'resources', text: strings.ExperienceModeResources }
                  ],
                  selectedKey: normalizeExperienceMode(this.properties.experienceMode)
                }),
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
