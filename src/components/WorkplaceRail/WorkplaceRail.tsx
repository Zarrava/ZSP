import * as React from 'react';
import { useEffect, useState } from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { IEvent } from '../../models/Event';
import { formatRelativeDate } from '../../utils/greetingUtils';
import {
  getAllWorldClockDisplays,
  IWorldClockDisplay
} from '../../utils/worldClockUtils';
import styles from './WorkplaceRail.module.scss';

export interface IWorkplaceRailProps {
  events: IEvent[];
  isLoading?: boolean;
  error?: string;
}

const CLOCK_REFRESH_MS = 30000;

const ClockCard: React.FC<{ clock: IWorldClockDisplay }> = ({ clock }) => (
  <div className={styles.clockCard}>
    <span className={styles.clockCity}>{clock.label}</span>
    <div className={styles.clockTimeRow}>
      <span className={styles.clockTime}>{clock.time}</span>
      <span className={styles.clockPeriod}>{clock.period}</span>
    </div>
    {clock.offsetLabel && (
      <span className={styles.clockOffset}>{clock.offsetLabel}</span>
    )}
  </div>
);

const FeaturedEventCard: React.FC<{ event: IEvent }> = ({ event }) => {
  const href = event.meetingUrl || event.url;
  const content = (
    <>
      <span className={styles.eventEyebrow}>Next on your calendar</span>
      <h3 className={styles.eventTitle}>{event.title}</h3>
      <div className={styles.eventMeta}>
        <Icon iconName="Clock" className={styles.eventMetaIcon} aria-hidden="true" />
        <span>{event.time}</span>
        {event.date && (
          <>
            <span className={styles.eventMetaDivider} aria-hidden="true">·</span>
            <span>{formatRelativeDate(event.date)}</span>
          </>
        )}
      </div>
      {href && (
        <span className={styles.eventAction}>
          Open event
          <Icon iconName="ChevronRight" aria-hidden="true" />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a className={styles.eventCard} href={href}>
        {content}
      </a>
    );
  }

  return <article className={styles.eventCard}>{content}</article>;
};

export const WorkplaceRail: React.FC<IWorkplaceRailProps> = ({
  events,
  isLoading,
  error
}) => {
  const [clocks, setClocks] = useState(() => getAllWorldClockDisplays());

  useEffect(() => {
    const refresh = (): void => {
      setClocks(getAllWorldClockDisplays());
    };

    refresh();
    const timer = window.setInterval(refresh, CLOCK_REFRESH_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const featuredEvent = events[0];
  const showEventEmpty = !isLoading && !error && !featuredEvent;

  return (
    <aside className={styles.rail} aria-label="Workplace sidebar">
      <section className={styles.panel} aria-labelledby="world-clocks-heading">
        <h2 id="world-clocks-heading" className={styles.panelTitle}>
          Global offices
        </h2>
        <ul className={styles.clockList}>
          {clocks.map((clock) => (
            <li key={clock.id}>
              <ClockCard clock={clock} />
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel} aria-labelledby="featured-event-heading">
        <h2 id="featured-event-heading" className={styles.panelTitle}>
          Up next
        </h2>
        {isLoading && (
          <div className={styles.eventSkeleton} aria-hidden="true">
            <span className={styles.skeletonBar} />
            <span className={styles.skeletonBarShort} />
          </div>
        )}
        {!isLoading && error && (
          <p className={styles.eventEmpty}>Calendar unavailable.</p>
        )}
        {showEventEmpty && (
          <p className={styles.eventEmpty}>No upcoming events on your calendar.</p>
        )}
        {!isLoading && !error && featuredEvent && (
          <FeaturedEventCard event={featuredEvent} />
        )}
      </section>
    </aside>
  );
};
