import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { defaultWorkplaceConfig } from '../../config/defaultWorkplaceConfig';
import { IWorkplaceServices } from '../../services/IWorkplaceServices';
import { emptyRoleContext } from '../../models/IUserRoleContext';
import { ZefSitePageRouter } from './ZefSitePageRouter';
import { ZEF_DUMMY_VISIBLE_PHRASES } from '../../content/zefDummyContent';

const CONFIGURATION_PLACEHOLDER = 'ZEF page experience not configured';

const services = {
  config: defaultWorkplaceConfig,
  isLocalDev: true,
  userContext: {
    getUserProfile: () => ({ displayName: 'Test User' }),
    getUserProfileAsync: async () => ({ displayName: 'Test User' }),
    getRoleContext: () => emptyRoleContext()
  },
  sharePoint: {
    getAnnouncements: async () => [],
    getDepartments: async () => [],
    getResources: async () => [],
    getQuickAccessItems: async () => []
  },
  graph: {
    getCurrentUser: async () => ({ displayName: 'Test User' }),
    getUpcomingEvents: async () => [],
    getMyTeams: async () => [],
    getMyRecentDocuments: async () => [],
    getMyTasks: async () => [],
    getPersonalizedWorkspace: async () => [],
    getOneDriveWebUrl: async () => undefined
  }
} as IWorkplaceServices;

const expectRoutedPage = async (
  pagePath: string,
  experienceMode: string | undefined,
  headline: string
): Promise<void> => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  try {
    await act(async () => {
      ReactDOM.render(
        <ZefSitePageRouter
          services={services}
          experienceMode={experienceMode}
          pagePath={pagePath}
        />,
        container
      );
    });

    expect(container.textContent).toContain(headline);
    expect(container.textContent).not.toContain(CONFIGURATION_PLACEHOLDER);
    expect(container.textContent).not.toContain('Set this web part to Auto');
    expect(container.textContent).not.toContain('dedicated to our customers');
    expect(container.textContent).not.toContain('our employees');
    expect(container.textContent).not.toContain('Find what you need');
    expect(container.textContent).not.toContain('Explore resources');
    expect(container.textContent).not.toContain('Welcome to our platform');
  }
  finally {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  }
};

describe('ZefSitePageRouter', () => {
  it('does not show the configuration placeholder for a legacy instance on a valid ZEF page', async () => {
    const pages: Array<{ path: string; headline: string }> = [
      { path: '/sites/zef/SitePages/OrganizationHome.aspx', headline: 'Your work.' },
      { path: '/sites/zef/SitePages/Who-we-are.aspx', headline: 'Who we are' },
      { path: '/sites/zef/SitePages/What%27s-happening.aspx?Mode=Edit', headline: 'What\'s happening.' },
      { path: '/sites/zef/SitePages/Find-it.aspx#library', headline: 'Resources.' }
    ];

    for (const page of pages) {
      await expectRoutedPage(page.path, undefined, page.headline);
    }
  });

  it('honours an explicit override instead of the page URL', async () => {
    await expectRoutedPage('/sites/zef/SitePages/Find-it.aspx', 'whoWeAre', 'Who we are');
  });

  it('falls back to the digital workplace homepage for an unknown page', async () => {
    await expectRoutedPage('/sites/zef/SitePages/Other.aspx', undefined, 'Your work.');
  });

  it('renders verified Zurfte Empowercare Foundation content on Who We Are', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      await act(async () => {
        ReactDOM.render(
          <ZefSitePageRouter
            services={services}
            experienceMode="whoWeAre"
            pagePath="/sites/zef/SitePages/Who-we-are.aspx"
          />,
          container
        );
      });

      const text = container.textContent || '';
      expect(text).toContain('To empower young people and underserved communities through education, entrepreneurship, mentorship, innovation, community development, and opportunity creation.');
      expect(text).toContain('Social Impact & Community Development');
      expect(text).toContain('Innovation, Technology & Solutions Development');
      expect(text).toContain('Digital Skills Development');
      expect(text).toContain('Opportunity Creation');
      expect(text).toContain('Programs & Outreach');
      expect(text).toContain('Human Resources');
      expect(text).toContain('Zurfte Empowercare Foundation home');
      expect(text).not.toContain('Capacity Building');
      expect(text).not.toContain('Clear information');
      expect(text).not.toContain('Find what you need');
      expect(text).not.toContain('A future where individuals and communities');
      expect(text).not.toContain('ZEF Digital Workplace');
      expect(text).not.toContain('Our Vision');
    }
    finally {
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
    }
  });

  it('renders live ZEF empty states and does not invent announcements or events', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      await act(async () => {
        ReactDOM.render(
          <ZefSitePageRouter
            services={services}
            experienceMode="whatsHappening"
            pagePath="/sites/zef/SitePages/What's-happening.aspx"
          />,
          container
        );
      });

      const text = container.textContent || '';
      expect(text).toContain('Stay connected with announcements, events and activities from Zurfte Empowercare Foundation.');
      expect(text).toContain('Announcements from ZEF');
      expect(text).toContain('No new updates yet.');
      expect(text).toContain('Check back soon for announcements, events and activities from Zurfte Empowercare Foundation.');
      expect(text).toContain('Upcoming ZEF Events');
      expect(text).toContain('No upcoming ZEF events.');
      expect(text).not.toContain('ZEF activities and community updates');
      expect(text).not.toContain('Leadership meeting');
      expect(text).not.toContain('Microsoft Teams migration');
    }
    finally {
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
    }
  });

  it('renders the resources page from live data without invented categories', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    try {
      await act(async () => {
        ReactDOM.render(
          <ZefSitePageRouter
            services={services}
            experienceMode="resources"
            pagePath="/sites/zef/SitePages/Find-it.aspx"
          />,
          container
        );
      });

      const text = container.textContent || '';
      expect(text).toContain('Organizational resources and verified workplace links for members of Zurfte Empowercare Foundation.');
      expect(text).toContain('ZEF Quick Access');
      expect(text).toContain('ZEF Resources');
      expect(text).toContain('Coming soon');
      expect(text).toContain('This resource will be added when a verified destination is available.');
      expect(text).not.toContain('Volunteer Handbook');
      expect(text).not.toContain('Find what you need');
      expect(text).not.toContain('Explore our resources');
      expect(text).not.toContain('Chat & meetings');
      expect(text).not.toContain('Microsoft 365 help');
    }
    finally {
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
    }
  });

  it('drops seeded dummy announcements, events, and generic resource copy', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const seeded = {
      ...services,
      sharePoint: {
        ...services.sharePoint,
        getAnnouncements: async () => [
          { id: 'ann-seed', title: 'Welcome to the ZEF Digital Workplace', date: '2026-09-19', category: 'General' },
          { id: 'ann-real', title: 'Community skills workshop', date: '2026-09-20', summary: 'A Zurfte Empowercare Foundation workshop.', category: 'Community' }
        ],
        getResources: async () => [
          {
            id: 'res-m365',
            title: 'Microsoft 365 help',
            description: 'Official Microsoft 365 training and help articles',
            url: 'https://support.microsoft.com/microsoft-365',
            category: 'Training'
          }
        ],
        getQuickAccessItems: async () => [
          { id: 'qa-teams', title: 'Teams', description: 'Chat & meetings', iconName: 'TeamsLogo', url: 'https://teams.microsoft.com' }
        ]
      },
      graph: {
        ...services.graph,
        getUpcomingEvents: async () => [
          { id: 'evt-seed', title: 'Leadership meeting', date: '2026-09-24', time: '10:00 AM' }
        ]
      }
    } as IWorkplaceServices;

    try {
      await act(async () => {
        ReactDOM.render(
          <ZefSitePageRouter
            services={seeded}
            experienceMode="whatsHappening"
            pagePath="/sites/zef/SitePages/What's-happening.aspx"
          />,
          container
        );
      });

      const happening = container.textContent || '';
      expect(happening).toContain('Community skills workshop');
      expect(happening).not.toContain('Welcome to the ZEF Digital Workplace');
      expect(happening).not.toContain('Leadership meeting');

      ReactDOM.unmountComponentAtNode(container);

      await act(async () => {
        ReactDOM.render(
          <ZefSitePageRouter
            services={seeded}
            experienceMode="resources"
            pagePath="/sites/zef/SitePages/Find-it.aspx"
          />,
          container
        );
      });

      const resources = container.textContent || '';
      expect(resources).toContain('Microsoft 365 guidance for Zurfte Empowercare Foundation members.');
      expect(resources).toContain('Microsoft Teams used by Zurfte Empowercare Foundation members.');
      expect(resources).not.toContain('Official Microsoft 365 training');
      expect(resources).not.toContain('Chat & meetings');
      ZEF_DUMMY_VISIBLE_PHRASES.forEach((phrase) => {
        expect(resources).not.toContain(phrase);
        expect(happening).not.toContain(phrase);
      });
    }
    finally {
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
    }
  });
});
