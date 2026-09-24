import {
  isSharePointNavigationActive,
  mapSharePointNavigationNodes,
  resolveSharePointNavigationUrl,
  selectZefPrimaryNavigationItems
} from './sharePointNavigationUtils';

describe('sharePointNavigationUtils', () => {
  const webUrl = 'https://zurfteempowercare.sharepoint.com/sites/zef';

  it('maps visible navigation nodes and excludes empty or Recent entries', () => {
    const nodes = mapSharePointNavigationNodes([
      { Id: 1, Title: 'Home', Url: '/sites/zef', IsVisible: true },
      { Id: 2, Title: 'Recent', Url: '', IsVisible: true },
      { Id: 3, Title: 'Resources', Url: '/sites/zef/SitePages/Find-it.aspx', IsVisible: true },
      { Id: 4, Title: 'Hidden', Url: '/hidden', IsVisible: false }
    ]);

    expect(nodes).toHaveLength(2);
    expect(nodes[0].title).toBe('Home');
    expect(nodes[1].title).toBe('Resources');
  });

  it('resolves server-relative SharePoint URLs against the web origin', () => {
    expect(resolveSharePointNavigationUrl('/sites/zef/SitePages/Who-we-are.aspx', webUrl))
      .toBe('https://zurfteempowercare.sharepoint.com/sites/zef/SitePages/Who-we-are.aspx');
  });

  it('selects only authoritative ZEF primary navigation items in order', () => {
    const items = selectZefPrimaryNavigationItems([
      { id: 4, title: 'Resources', url: '/sites/zef/SitePages/Find-it.aspx' },
      { id: 1, title: 'Home', url: '/sites/zef' },
      { id: 99, title: 'Recent', url: '' },
      { id: 2, title: 'Who we are', url: '/sites/zef/SitePages/Who-we-are.aspx' },
      { id: 3, title: "What's happening", url: '/sites/zef/SitePages/What\'s-happening.aspx' }
    ]);

    expect(items.map((item) => item.title)).toEqual([
      'Home',
      'Who we are',
      "What's happening",
      'Resources'
    ]);
  });

  it('detects active navigation for the current page', () => {
    const active = isSharePointNavigationActive(
      '/sites/zef/SitePages/Who-we-are.aspx',
      'https://zurfteempowercare.sharepoint.com/sites/zef/SitePages/Who-we-are.aspx',
      webUrl
    );

    expect(active).toBe(true);
  });

  it('highlights Home on OrganizationHome and not on the other ZEF pages', () => {
    const homeItem = '/sites/zef';
    expect(isSharePointNavigationActive(
      homeItem,
      'https://zurfteempowercare.sharepoint.com/sites/zef/SitePages/OrganizationHome.aspx',
      webUrl
    )).toBe(true);
    expect(isSharePointNavigationActive(
      homeItem,
      'https://zurfteempowercare.sharepoint.com/sites/zef/SitePages/Who-we-are.aspx',
      webUrl
    )).toBe(false);
  });

  it('highlights Who we are, What\'s happening, and Resources on their pages', () => {
    expect(isSharePointNavigationActive(
      '/sites/zef/SitePages/Who-we-are.aspx',
      'https://zurfteempowercare.sharepoint.com/sites/zef/SitePages/WHO-WE-ARE.aspx?Mode=Edit',
      webUrl
    )).toBe(true);
    expect(isSharePointNavigationActive(
      '/sites/zef/SitePages/What\'s-happening.aspx',
      'https://zurfteempowercare.sharepoint.com/sites/zef/SitePages/What%27s-happening.aspx',
      webUrl
    )).toBe(true);
    expect(isSharePointNavigationActive(
      '/sites/zef/SitePages/Find-it.aspx',
      'https://zurfteempowercare.sharepoint.com/sites/zef/SitePages/Find-it.aspx#library',
      webUrl
    )).toBe(true);
    expect(isSharePointNavigationActive(
      '/sites/zef/SitePages/Find-it.aspx',
      'https://zurfteempowercare.sharepoint.com/sites/zef/SitePages/Who-we-are.aspx',
      webUrl
    )).toBe(false);
  });
});
