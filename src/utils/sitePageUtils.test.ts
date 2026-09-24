import {
  getZefPageExperienceFromLocation,
  normalizeExperienceMode,
  resolveConfiguredSitePageExperience,
  resolveZefSitePage
} from './sitePageUtils';

const ORGANIZATION_HOME = '/sites/zef/SitePages/OrganizationHome.aspx';
const WHO_WE_ARE = '/sites/zef/SitePages/Who-we-are.aspx';
const WHATS_HAPPENING = '/sites/zef/SitePages/What\'s-happening.aspx';
const WHATS_HAPPENING_ENCODED = '/sites/zef/SitePages/What%27s-happening.aspx';
const FIND_IT = '/sites/zef/SitePages/Find-it.aspx';

describe('sitePageUtils', () => {
  const originalPath = window.location.pathname;

  afterEach(() => {
    window.history.pushState({}, '', originalPath);
  });

  it('treats undefined experienceMode as auto and detects the page from the URL', () => {
    expect(normalizeExperienceMode(undefined)).toBe('auto');
    expect(resolveConfiguredSitePageExperience(undefined, WHO_WE_ARE)).toBe('whoWeAre');
  });

  it('treats null experienceMode as auto', () => {
    const nullMode: unknown = JSON.parse('null');
    expect(normalizeExperienceMode(nullMode)).toBe('auto');
    expect(resolveConfiguredSitePageExperience(nullMode, FIND_IT)).toBe('resources');
  });

  it('treats an empty experienceMode as auto', () => {
    expect(normalizeExperienceMode('')).toBe('auto');
    expect(resolveConfiguredSitePageExperience('', WHATS_HAPPENING)).toBe('whatsHappening');
  });

  it('treats whitespace experienceMode as auto', () => {
    expect(normalizeExperienceMode('   ')).toBe('auto');
    expect(resolveConfiguredSitePageExperience(' \t ', ORGANIZATION_HOME)).toBe('organizationHome');
  });

  it('treats an invalid experienceMode as auto', () => {
    expect(normalizeExperienceMode('not-a-page')).toBe('auto');
    expect(normalizeExperienceMode('home')).toBe('auto');
    expect(resolveConfiguredSitePageExperience('unconfigured', WHO_WE_ARE)).toBe('whoWeAre');
  });

  it('uses URL detection when experienceMode is explicitly auto', () => {
    expect(resolveConfiguredSitePageExperience('auto', FIND_IT)).toBe('resources');
    expect(resolveConfiguredSitePageExperience('AUTO', ORGANIZATION_HOME)).toBe('organizationHome');
  });

  it('honours an explicit whoWeAre override', () => {
    expect(resolveConfiguredSitePageExperience('whoWeAre', FIND_IT)).toBe('whoWeAre');
  });

  it('honours an explicit whatsHappening override', () => {
    expect(resolveConfiguredSitePageExperience('whatsHappening', WHO_WE_ARE)).toBe('whatsHappening');
  });

  it('honours an explicit resources override', () => {
    expect(resolveConfiguredSitePageExperience('resources', ORGANIZATION_HOME)).toBe('resources');
  });

  it('honours an explicit organizationHome override', () => {
    expect(resolveConfiguredSitePageExperience('organizationHome', FIND_IT)).toBe('organizationHome');
  });

  it('maps OrganizationHome.aspx to the digital workplace homepage', () => {
    expect(resolveZefSitePage(ORGANIZATION_HOME)).toBe('organizationHome');
  });

  it('maps Who-we-are.aspx to who we are', () => {
    expect(resolveZefSitePage(WHO_WE_ARE)).toBe('whoWeAre');
  });

  it('maps What\'s-happening.aspx to what\'s happening', () => {
    expect(resolveZefSitePage(WHATS_HAPPENING)).toBe('whatsHappening');
  });

  it('maps a URL-encoded What\'s-happening.aspx path to what\'s happening', () => {
    expect(resolveZefSitePage(WHATS_HAPPENING_ENCODED)).toBe('whatsHappening');
  });

  it('maps Find-it.aspx to resources', () => {
    expect(resolveZefSitePage(FIND_IT)).toBe('resources');
  });

  it('falls back to the digital workplace homepage for an unknown page', () => {
    expect(resolveZefSitePage('/sites/zef/SitePages/Other.aspx')).toBe('organizationHome');
    expect(resolveConfiguredSitePageExperience('auto', '/sites/zef')).toBe('organizationHome');
    expect(resolveConfiguredSitePageExperience(undefined, '')).toBe('organizationHome');
  });

  it('matches page filenames without regard to case', () => {
    expect(resolveZefSitePage('/sites/ZEF/SitePages/ORGANIZATIONHOME.ASPX')).toBe('organizationHome');
    expect(resolveZefSitePage('/sites/ZEF/SitePages/WHO-WE-ARE.ASPX')).toBe('whoWeAre');
    expect(resolveZefSitePage('/sites/ZEF/SitePages/FIND-IT.ASPX')).toBe('resources');
  });

  it('ignores trailing slashes, query strings, and hash fragments', () => {
    expect(resolveZefSitePage(`${WHO_WE_ARE}/`)).toBe('whoWeAre');
    expect(resolveZefSitePage(`${WHO_WE_ARE}?Mode=Edit&PageView=SharedView`)).toBe('whoWeAre');
    expect(resolveZefSitePage(`${WHATS_HAPPENING}#announcements`)).toBe('whatsHappening');
    expect(resolveZefSitePage(`${WHATS_HAPPENING_ENCODED}/?Mode=Edit#top`)).toBe('whatsHappening');
    expect(getZefPageExperienceFromLocation(`${FIND_IT}?Mode=Edit`)).toBe('resources');
  });

  it('reads window.location.pathname when no path is supplied', () => {
    window.history.pushState({}, '', WHO_WE_ARE);
    expect(resolveZefSitePage()).toBe('whoWeAre');

    window.history.pushState({}, '', `${WHATS_HAPPENING_ENCODED}?Mode=Edit#top`);
    expect(getZefPageExperienceFromLocation()).toBe('whatsHappening');
  });

  it('keeps a legacy web-part instance with no experienceMode on URL detection', () => {
    const legacyProperties: { experienceMode?: string } = {};
    expect(resolveConfiguredSitePageExperience(legacyProperties.experienceMode, WHO_WE_ARE)).toBe('whoWeAre');
    expect(resolveConfiguredSitePageExperience(legacyProperties.experienceMode, WHATS_HAPPENING_ENCODED)).toBe('whatsHappening');
    expect(resolveConfiguredSitePageExperience(legacyProperties.experienceMode, FIND_IT)).toBe('resources');
    expect(resolveConfiguredSitePageExperience(legacyProperties.experienceMode, ORGANIZATION_HOME)).toBe('organizationHome');
  });

  it('still honours a previously saved kebab-case override', () => {
    expect(resolveConfiguredSitePageExperience('who-we-are', FIND_IT)).toBe('whoWeAre');
    expect(resolveConfiguredSitePageExperience('whats-happening', ORGANIZATION_HOME)).toBe('whatsHappening');
    expect(resolveConfiguredSitePageExperience('digital-workplace', WHO_WE_ARE)).toBe('organizationHome');
  });
});
