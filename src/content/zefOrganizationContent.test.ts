import {
  ZEF_ABOUT_STATEMENT,
  ZEF_CORE_FOCUS_AREAS,
  ZEF_DETAIL_PENDING,
  ZEF_MISSION_STATEMENT,
  ZEF_ORGANIZATIONAL_ARMS,
  ZEF_ORGANIZATION_INTRO,
  ZEF_ORGANIZATION_NAME,
  ZEF_WHO_WE_ARE_CTAS
} from './zefOrganizationContent';
import { ZEF_SITE_URLS } from './zefSiteNavigationUrls';
import { DEPARTMENT_CATALOG } from '../utils/departmentCatalog';
import {
  ZEF_DUMMY_ANNOUNCEMENT_TITLES,
  ZEF_DUMMY_EVENT_TITLES,
  ZEF_DUMMY_VISIBLE_PHRASES,
  excludeDummyRecords
} from './zefDummyContent';

describe('zefOrganizationContent', () => {
  it('defines the established core focus areas without invented descriptions', () => {
    expect(ZEF_CORE_FOCUS_AREAS.map((area) => area.title)).toEqual([
      'Digital Skills Development',
      'Entrepreneurship',
      'Mentorship',
      'Innovation & Technology',
      'Community Development',
      'Opportunity Creation'
    ]);
    ZEF_CORE_FOCUS_AREAS.forEach((area) => {
      expect(area.description).toBe(ZEF_DETAIL_PENDING);
    });
  });

  it('defines the two organizational arms from department catalog language', () => {
    expect(ZEF_ORGANIZATIONAL_ARMS.map((arm) => arm.title)).toEqual([
      'Social Impact & Community Development',
      'Innovation, Technology & Solutions Development'
    ]);
    expect(ZEF_ORGANIZATIONAL_ARMS[0].description).toContain(DEPARTMENT_CATALOG['Programs & Outreach'].description);
    expect(ZEF_ORGANIZATIONAL_ARMS[1].description).toContain(DEPARTMENT_CATALOG['Technology & Product'].description);
    expect(ZEF_ORGANIZATIONAL_ARMS[1].description).not.toContain('modern, consistent experiences');
  });

  it('uses the mission statement and does not invent a vision', () => {
    expect(ZEF_MISSION_STATEMENT).toBe(
      'To empower young people and underserved communities through education, entrepreneurship, mentorship, innovation, community development, and opportunity creation.'
    );
    expect(ZEF_ORGANIZATION_INTRO).toContain('young people and underserved communities');
    expect(ZEF_ABOUT_STATEMENT).toContain('nonprofit');
    expect(ZEF_ORGANIZATION_NAME).toBe('Zurfte Empowercare Foundation');
  });

  it('links Who We Are to the organization home', () => {
    expect(ZEF_WHO_WE_ARE_CTAS).toHaveLength(1);
    expect(ZEF_WHO_WE_ARE_CTAS[0].label).toBe('Zurfte Empowercare Foundation home');
    expect(ZEF_WHO_WE_ARE_CTAS[0].url).toBe(ZEF_SITE_URLS.digitalWorkplace);
  });

  it('excludes known dummy announcements and events', () => {
    const records = [
      { title: 'Welcome to the ZEF Digital Workplace' },
      { title: 'Community skills workshop' },
      { title: 'Leadership meeting' }
    ];

    const announcements = excludeDummyRecords(records, ZEF_DUMMY_ANNOUNCEMENT_TITLES);
    const events = excludeDummyRecords(records, ZEF_DUMMY_EVENT_TITLES);

    expect(announcements.map((item) => item.title)).toEqual([
      'Community skills workshop',
      'Leadership meeting'
    ]);
    expect(events.map((item) => item.title)).toEqual([
      'Welcome to the ZEF Digital Workplace',
      'Community skills workshop'
    ]);
    expect(ZEF_DUMMY_VISIBLE_PHRASES).toContain('Find what you need');
  });
});
