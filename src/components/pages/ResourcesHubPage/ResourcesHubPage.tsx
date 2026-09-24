import * as React from 'react';
import { useMemo } from 'react';
import { IWorkplaceServices } from '../../../services/IWorkplaceServices';
import { useWorkplaceData } from '../../../hooks/useWorkplaceData';
import { IQuickAccessItem } from '../../../models/QuickAccessItem';
import { IResource } from '../../../models/Resource';
import { ZefPageShell } from '../../page/ZefPageShell/ZefPageShell';
import { ZefPageHero } from '../../page/ZefPageHero/ZefPageHero';
import { QuickAccess } from '../../QuickAccess/QuickAccess';
import { Resources } from '../../Resources/Resources';

export interface IResourcesHubPageProps {
  services: IWorkplaceServices;
}

const QUICK_ACCESS_COPY: Record<string, { title: string; description: string }> = {
  'qa-teams': {
    title: 'ZEF Teams',
    description: 'Microsoft Teams used by Zurfte Empowercare Foundation members.'
  },
  'qa-documents': {
    title: 'ZEF documents',
    description: 'Shared documents for Zurfte Empowercare Foundation.'
  },
  'qa-calendar': {
    title: 'ZEF calendar',
    description: 'Calendar for Zurfte Empowercare Foundation.'
  },
  'qa-forms': {
    title: 'ZEF forms',
    description: 'Forms used by Zurfte Empowercare Foundation.'
  },
  'qa-sharepoint': {
    title: 'ZEF SharePoint',
    description: 'The Zurfte Empowercare Foundation SharePoint site.'
  }
};

const RESOURCE_COPY: Record<string, string> = {
  'Microsoft 365 help': 'Microsoft 365 guidance for Zurfte Empowercare Foundation members.',
  'Microsoft Teams help': 'Teams guidance for Zurfte Empowercare Foundation members.',
  'SharePoint help': 'SharePoint guidance for the Zurfte Empowercare Foundation site.'
};

const describeQuickAccess = (item: IQuickAccessItem): IQuickAccessItem => {
  const copy = QUICK_ACCESS_COPY[item.id];
  if (!copy || !item.url) {
    return item;
  }

  return {
    ...item,
    title: copy.title,
    description: copy.description
  };
};

const describeResource = (resource: IResource): IResource | undefined => {
  if (!resource.url) {
    return undefined;
  }

  const description = RESOURCE_COPY[resource.title] || resource.description;
  return {
    ...resource,
    description
  };
};

export const ResourcesHubPage: React.FC<IResourcesHubPageProps> = ({ services }) => {
  const data = useWorkplaceData(services);
  const quickAccess = useMemo(
    () => data.quickAccess.data.map(describeQuickAccess).filter((item) => !!item.url),
    [data.quickAccess.data]
  );
  const resources = useMemo(
    () => data.resources.data
      .map(describeResource)
      .filter((resource): resource is IResource => !!resource),
    [data.resources.data]
  );

  return (
    <ZefPageShell footerLinks={services.config.footer.links}>
      <ZefPageHero
        id="zef-resources-hero"
        eyebrow="Zurfte Empowercare Foundation"
        headline="Resources."
        intro="Organizational resources and verified workplace links for members of Zurfte Empowercare Foundation."
      />

      <QuickAccess
        title="ZEF Quick Access"
        eyebrow="Zurfte Empowercare Foundation"
        items={quickAccess}
        emptyTitle="Coming soon"
        emptyMessage="This resource will be added when a verified destination is available."
        isLoading={data.quickAccess.status === 'loading'}
        error={data.quickAccess.error}
      />

      <Resources
        title="ZEF Resources"
        eyebrow="Zurfte Empowercare Foundation"
        resources={resources}
        viewAllUrl={services.config.navigation.resourcesViewAllUrl}
        isLoading={data.resources.status === 'loading'}
        error={data.resources.error}
        emptyTitle="Coming soon"
        emptyMessage="This resource will be added when a verified destination is available."
        noteUnverifiedLinks
      />
    </ZefPageShell>
  );
};
