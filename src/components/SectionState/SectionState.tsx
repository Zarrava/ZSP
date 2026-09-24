import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './SectionState.module.scss';

export interface ISectionStateProps {
  isLoading?: boolean;
  error?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyIconName?: string;
  loadingMessage?: string;
}

export const SectionState: React.FC<ISectionStateProps> = ({
  isLoading,
  error,
  isEmpty,
  emptyMessage = 'Nothing to show yet.',
  emptyTitle,
  emptyIconName = 'Info',
  loadingMessage = 'Loading…'
}) => {
  if (isLoading) {
    return (
      <div className={styles.wrapper} role="status" aria-label={loadingMessage}>
        <div className={styles.loading}>
          <span className={styles.loadingBar} />
          <span className={styles.loadingBar} />
          <span className={styles.loadingBar} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrapper} role="alert">
        <p className={styles.error}>
          <Icon iconName="ErrorBadge" className={styles.errorIcon} aria-hidden="true" />
          <span>{error}</span>
        </p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.empty}>
          <div className={styles.emptyIconWrap}>
            <Icon iconName={emptyIconName} className={styles.emptyIcon} aria-hidden="true" />
          </div>
          {emptyTitle && <p className={styles.emptyTitle}>{emptyTitle}</p>}
          <p className={styles.emptyText}>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return null;
};
