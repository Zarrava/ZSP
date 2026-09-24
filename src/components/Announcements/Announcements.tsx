import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { IAnnouncement } from '../../models/Announcement';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { SectionState } from '../SectionState/SectionState';
import { formatRelativeDate } from '../../utils/greetingUtils';
import styles from './Announcements.module.scss';

export interface IAnnouncementsProps {
  announcements: IAnnouncement[];
  viewAllUrl?: string;
  isLoading?: boolean;
  error?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  title?: string;
  eyebrow?: string;
  showSummaries?: boolean;
}

const getPriorityClass = (priority?: string): string => {
  const normalized = (priority || 'Normal').trim().toLowerCase();
  if (normalized === 'urgent') {
    return styles.priorityUrgent;
  }
  if (normalized === 'important') {
    return styles.priorityImportant;
  }
  return styles.priorityNormal;
};

const getPriorityLabel = (priority?: string): string => {
  const normalized = (priority || 'Normal').trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

const AnnouncementCard: React.FC<{
  announcement: IAnnouncement;
  featured?: boolean;
  showSummary?: boolean;
}> = ({ announcement, featured, showSummary }) => {
  const priorityClass = getPriorityClass(announcement.priority);
  const cardClass = featured
    ? `${styles.card} ${styles.cardFeatured}`
    : styles.card;

  const content = (
    <>
      <div className={styles.cardHeader}>
        {announcement.category && (
          <span className={styles.category}>{announcement.category}</span>
        )}
        <span className={`${styles.priority} ${priorityClass}`}>
          {getPriorityLabel(announcement.priority)}
        </span>
      </div>
      <h3 className={styles.cardTitle}>{announcement.title}</h3>
      {announcement.summary && (featured || showSummary) && (
        <p className={styles.cardSummary}>{announcement.summary}</p>
      )}
      <div className={styles.cardMeta}>
        <Icon iconName="Clock" className={styles.metaIcon} aria-hidden="true" />
        <span>{formatRelativeDate(announcement.date)}</span>
      </div>
      {announcement.url && (
        <span className={styles.readMore}>
          Read more
          <Icon iconName="ChevronRight" aria-hidden="true" />
        </span>
      )}
    </>
  );

  if (announcement.url) {
    return (
      <a className={cardClass} href={announcement.url}>
        {content}
      </a>
    );
  }

  return <article className={cardClass}>{content}</article>;
};

export const Announcements: React.FC<IAnnouncementsProps> = ({
  announcements,
  viewAllUrl,
  isLoading,
  error,
  emptyTitle = 'No announcements right now',
  emptyMessage = 'Organization updates will appear here when published.',
  title = 'Announcements',
  eyebrow = 'Organization',
  showSummaries = false
}) => {
  const visible = announcements.slice(0, 5);
  const showEmpty = !isLoading && !error && visible.length === 0;
  const [featured, ...rest] = visible;
  const headingId = `${title.toLowerCase().replace(/\s+/g, '-')}-heading`;

  return (
    <section className={styles.announcements} aria-labelledby={headingId}>
      <div className={styles.panel}>
        <SectionHeader
          title={title}
          eyebrow={eyebrow}
          viewAllLabel="View all"
          viewAllUrl={viewAllUrl}
        />
        <SectionState
          isLoading={isLoading}
          error={error ? 'Announcements unavailable. Try again later.' : undefined}
          isEmpty={showEmpty}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          emptyIconName="Megaphone"
        />
        {!isLoading && !error && visible.length > 0 && (
          <div className={styles.content}>
            {featured && (
              <AnnouncementCard announcement={featured} featured showSummary={showSummaries} />
            )}
            {rest.length > 0 && (
              <ul className={styles.list}>
                {rest.map((announcement) => (
                  <li key={announcement.id}>
                    <AnnouncementCard announcement={announcement} showSummary={showSummaries} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
