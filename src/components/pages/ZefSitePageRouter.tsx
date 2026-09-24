import * as React from 'react';
import { DigitalWorkplaceHome } from '../DigitalWorkplaceHome/DigitalWorkplaceHome';
import { WhoWeArePage } from './WhoWeArePage/WhoWeArePage';
import { WhatsHappeningPage } from './WhatsHappeningPage/WhatsHappeningPage';
import { ResourcesHubPage } from './ResourcesHubPage/ResourcesHubPage';
import { IWorkplaceServices } from '../../services/IWorkplaceServices';
import { resolveConfiguredSitePageExperience } from '../../utils/sitePageUtils';

export interface IZefSitePageRouterProps {
  services: IWorkplaceServices;
  /** Missing, empty, and invalid values are treated as Auto. */
  experienceMode?: string;
  pagePath?: string;
}

export const ZefSitePageRouter: React.FC<IZefSitePageRouterProps> = ({
  services,
  experienceMode,
  pagePath
}) => {
  const pathname = pagePath
    || (typeof window !== 'undefined' ? window.location.pathname : '');
  const experience = resolveConfiguredSitePageExperience(experienceMode, pathname);

  switch (experience) {
    case 'whoWeAre':
      return <WhoWeArePage services={services} />;
    case 'whatsHappening':
      return <WhatsHappeningPage services={services} />;
    case 'resources':
      return <ResourcesHubPage services={services} />;
    case 'organizationHome':
    default:
      return <DigitalWorkplaceHome services={services} />;
  }
};
