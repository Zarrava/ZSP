import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { IEvent } from '../../models/Event';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { SectionState } from '../SectionState/SectionState';
import styles from './UpcomingEvents.module.scss';

export interface IUpcomingEventsProps {
  events: IEvent[];
  viewAllUrl?: string;
  isLoading?: boolean;
  error?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  title?: string;
  eyebrow?: string;
}

const formatEventDate = (dateString: string): { day: string; month: string; weekday: string } => {
  const date = new Date(dateString);
  return {
    day: date.getDate() < 10 ? `0${date.getDate()}` : date.getDate().toString(),
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
  };
};

const EventCard: React.FC<{ event: IEvent; isPrimary?: boolean }> = ({ event, isPrimary }) => {
  const { day, month, weekday } = formatEventDate(event.date);
  const href = event.meetingUrl || event.url;
  const cardClass = isPrimary ? `${styles.card} ${styles.cardPrimary}` : styles.card;

  const content = (
    <>
      <div className={styles.dateBlock} aria-hidden="true">
        <span className={styles.dateMonth}>{month}</span>
        <span className={styles.dateDay}>{day}</span>
        <span className={styles.dateWeekday}>{weekday}</span>
      </div>
      <div className={styles.details}>
        <h3 className={styles.title}>{event.title}</h3>
        <div className={styles.meta}>
          <Icon iconName="Clock" className={styles.metaIcon} aria-hidden="true" />
          <span>{event.time}</span>
        </div>
        {event.location && (
          <div className={styles.meta}>
            <Icon iconName="POI" className={styles.metaIcon} aria-hidden="true" />
            <span>{event.location}</span>
          </div>
        )}
      </div>
      {href && (
        <Icon iconName="ChevronRight" className={styles.chevron} aria-hidden="true" />
      )}
    </>
  );

  if (href) {
    return (
      <a className={cardClass} href={href}>
        {content}
      </a>
    );
  }

  return <article className={cardClass}>{content}</article>;
};

export const UpcomingEvents: React.FC<IUpcomingEventsProps> = ({
  events,
  viewAllUrl,
  isLoading,
  error,
  emptyTitle = 'No upcoming events',
  emptyMessage = 'Your calendar events will appear here when scheduled.',
  title = 'Upcoming',
  eyebrow = 'Calendar'
}) => {
  const showEmpty = !isLoading && !error && events.length === 0;
  const [primary, ...rest] = events;
  const headingId = title === 'Upcoming'
    ? 'upcoming-events-heading'
    : `${title.toLowerCase().replace(/\s+/g, '-')}-heading`;

  return (
    <section className={styles.upcomingEvents} aria-labelledby={headingId}>
      <div className={styles.panel}>
        <SectionHeader
          title={title}
          eyebrow={eyebrow}
          viewAllLabel="View all"
          viewAllUrl={viewAllUrl}
        />
        <SectionState
          isLoading={isLoading}
          error={error ? 'Calendar unavailable. Try again later.' : undefined}
          isEmpty={showEmpty}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          emptyIconName="Calendar"
        />
        {!isLoading && !error && events.length > 0 && (
          <div className={styles.content}>
            {primary && <EventCard event={primary} isPrimary />}
            {rest.length > 0 && (
              <ul className={styles.list}>
                {rest.map((event) => (
                  <li key={event.id}>
                    <EventCard event={event} />
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
