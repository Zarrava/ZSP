import * as React from 'react';
import { IWorkplaceServices } from '../../../services/IWorkplaceServices';
import { useWorkplaceData } from '../../../hooks/useWorkplaceData';
import { ZefPageShell } from '../../page/ZefPageShell/ZefPageShell';
import { ZefPageHero } from '../../page/ZefPageHero/ZefPageHero';
import { ZefSection } from '../../page/ZefSection/ZefSection';
import { Announcements } from '../../Announcements/Announcements';
import { UpcomingEvents } from '../../UpcomingEvents/UpcomingEvents';
import { formatRelativeDate } from '../../../utils/greetingUtils';
import {
  ZEF_DUMMY_ANNOUNCEMENT_TITLES,
  ZEF_DUMMY_EVENT_TITLES,
  excludeDummyRecords
} from '../../../content/zefDummyContent';
import styles from './WhatsHappeningPage.module.scss';

export interface IWhatsHappeningPageProps {
  services: IWorkplaceServices;
}

const NO_UPDATES_TITLE = 'No new updates yet.';
const NO_UPDATES_MESSAGE = 'Check back soon for announcements, events and activities from Zurfte Empowercare Foundation.';
const NO_EVENTS_TITLE = 'No upcoming ZEF events.';
const NO_EVENTS_MESSAGE = 'Check back soon for events from Zurfte Empowercare Foundation.';

export const WhatsHappeningPage: React.FC<IWhatsHappeningPageProps> = ({ services }) => {
  const data = useWorkplaceData(services);
  const announcements = excludeDummyRecords(data.announcements.data, ZEF_DUMMY_ANNOUNCEMENT_TITLES);
  const events = excludeDummyRecords(data.events.data, ZEF_DUMMY_EVENT_TITLES);
  const communityAnnouncements = announcements.filter((item) => {
    const category = item.category?.toLowerCase() ?? '';
    return category.includes('community') || category.includes('event') || category.includes('operations');
  });

  return (
    <ZefPageShell footerLinks={services.config.footer.links}>
      <ZefPageHero
        id="whats-happening-heading"
        eyebrow="Zurfte Empowercare Foundation"
        headline="What's happening."
        intro="Stay connected with announcements, events and activities from Zurfte Empowercare Foundation."
      />

      <div className={styles.editorialGrid}>
        <Announcements
          title="Announcements from ZEF"
          eyebrow="Zurfte Empowercare Foundation"
          announcements={announcements}
          viewAllUrl={services.config.navigation.announcementsViewAllUrl}
          isLoading={data.announcements.status === 'loading'}
          error={data.announcements.error}
          emptyTitle={NO_UPDATES_TITLE}
          emptyMessage={NO_UPDATES_MESSAGE}
          showSummaries
        />
        <UpcomingEvents
          title="Upcoming ZEF Events"
          eyebrow="Zurfte Empowercare Foundation"
          events={events}
          viewAllUrl={services.config.navigation.eventsViewAllUrl}
          isLoading={data.events.status === 'loading'}
          error={data.events.error}
          emptyTitle={NO_EVENTS_TITLE}
          emptyMessage={NO_EVENTS_MESSAGE}
        />
      </div>

      {communityAnnouncements.length > 0 && data.announcements.status === 'success' && (
        <ZefSection title="ZEF activities and community updates" eyebrow="Zurfte Empowercare Foundation">
          <ul className={styles.activityList}>
            {communityAnnouncements.slice(0, 6).map((announcement) => (
              <li key={announcement.id}>
                {announcement.url ? (
                  <a className={styles.activityItem} href={announcement.url}>
                    {announcement.category && (
                      <span className={styles.featuredCategory}>{announcement.category}</span>
                    )}
                    <span className={styles.activityTitle}>{announcement.title}</span>
                    {announcement.summary && (
                      <span className={styles.featuredSummary}>{announcement.summary}</span>
                    )}
                    <span className={styles.activityMeta}>{formatRelativeDate(announcement.date)}</span>
                  </a>
                ) : (
                  <article className={styles.activityItem}>
                    {announcement.category && (
                      <span className={styles.featuredCategory}>{announcement.category}</span>
                    )}
                    <span className={styles.activityTitle}>{announcement.title}</span>
                    {announcement.summary && (
                      <span className={styles.featuredSummary}>{announcement.summary}</span>
                    )}
                    <span className={styles.activityMeta}>{formatRelativeDate(announcement.date)}</span>
                  </article>
                )}
              </li>
            ))}
          </ul>
        </ZefSection>
      )}
    </ZefPageShell>
  );
};
