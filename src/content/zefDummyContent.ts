/**
 * Titles that were authored as local mock data or SharePoint seed placeholders.
 * Secondary pages must not render these records, even if a list still contains them.
 * This does not delete SharePoint items.
 */
export const ZEF_DUMMY_ANNOUNCEMENT_TITLES: readonly string[] = [
  'Microsoft Teams migration completed',
  'Volunteer engagement update',
  'New organizational policy published',
  'Q4 content calendar planning underway',
  'Welcome to the ZEF Digital Workplace',
  'Digital Workplace now available on SharePoint',
  'SharePoint lists now being configured',
  'Volunteer engagement through General Discussions',
  'Community Managers — Design graphics requests',
  'Community Managers - Design graphics requests',
  'HR resources available through the Resources section'
];

export const ZEF_DUMMY_EVENT_TITLES: readonly string[] = [
  'Leadership meeting',
  'Volunteer coordination',
  'Design review — social campaign',
  'Design review - social campaign'
];

export const ZEF_DUMMY_VISIBLE_PHRASES: readonly string[] = [
  'Find what you need',
  "What's happening at ZEF",
  'Welcome to our platform',
  'Explore our resources',
  'Chat & meetings',
  'Files & libraries',
  'Schedule & events',
  'Submit requests',
  'Official Microsoft 365 training',
  'Get started with Teams meetings',
  'Learn SharePoint sites, lists, and document libraries',
  'Microsoft Teams migration completed',
  'Leadership meeting',
  'Welcome to the ZEF Digital Workplace',
  'Lorem',
  'Our Values',
  'Capacity Building',
  'Clear information',
  'dedicated to our customers',
  'Your one-stop destination',
  'Empowering your journey'
];

export const excludeDummyRecords = <T extends { title?: string }>(
  items: readonly T[],
  blockedTitles: readonly string[]
): T[] => {
  const blocked = new Set(blockedTitles.map((title) => title.trim().toLowerCase()));
  return items.filter((item) => !blocked.has((item.title || '').trim().toLowerCase()));
};
