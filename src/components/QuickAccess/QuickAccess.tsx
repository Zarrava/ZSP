import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { IQuickAccessItem } from '../../models/QuickAccessItem';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { SectionState } from '../SectionState/SectionState';
import styles from './QuickAccess.module.scss';

export interface IQuickAccessProps {
  items: IQuickAccessItem[];
  isLoading?: boolean;
  error?: string;
  title?: string;
  eyebrow?: string;
  emptyTitle?: string;
  emptyMessage?: string;
}

const ACCENT_CLASSES = [
  styles.accentTeams,
  styles.accentDocuments,
  styles.accentCalendar,
  styles.accentForms,
  styles.accentSharePoint
];

const QuickAccessCard: React.FC<{ item: IQuickAccessItem; accentClass: string }> = ({
  item,
  accentClass
}) => {
  const content = (
    <>
      <div className={`${styles.iconWrap} ${accentClass}`}>
        <Icon iconName={item.iconName} className={styles.icon} aria-hidden="true" />
      </div>
      <div className={styles.label}>
        <span className={styles.title}>{item.title}</span>
        {item.description && (
          <span className={styles.description}>{item.description}</span>
        )}
      </div>
      <Icon iconName="ChevronRight" className={styles.arrow} aria-hidden="true" />
    </>
  );

  if (item.url) {
    return (
      <a className={styles.item} href={item.url}>
        {content}
      </a>
    );
  }

  return (
    <div className={`${styles.item} ${styles.itemStatic}`} aria-disabled="true">
      {content}
    </div>
  );
};

export const QuickAccess: React.FC<IQuickAccessProps> = ({
  items,
  isLoading,
  error,
  title = 'Quick access',
  eyebrow = 'Launch',
  emptyTitle,
  emptyMessage = 'Quick access links are not configured yet.'
}) => {
  const showEmpty = !isLoading && !error && items.length === 0;

  return (
    <section className={styles.quickAccess} aria-label={title}>
      <SectionHeader title={title} eyebrow={eyebrow} />
      <SectionState
        isLoading={isLoading}
        error={error ? 'Quick access unavailable.' : undefined}
        isEmpty={showEmpty}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        emptyIconName="Link"
      />
      {!isLoading && !error && items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item, index) => (
            <li key={item.id}>
              <QuickAccessCard
                item={item}
                accentClass={ACCENT_CLASSES[index % ACCENT_CLASSES.length]}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
