import * as React from 'react';
import styles from './SectionHeader.module.scss';

export interface ISectionHeaderProps {
  title: string;
  eyebrow?: string;
  viewAllLabel?: string;
  viewAllUrl?: string;
}

export const SectionHeader: React.FC<ISectionHeaderProps> = ({
  title,
  eyebrow,
  viewAllLabel,
  viewAllUrl
}) => {
  const headingId = `${title.toLowerCase().replace(/\s+/g, '-')}-heading`;

  return (
    <div className={styles.sectionHeader}>
      <div className={styles.titleGroup}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h2 id={headingId} className={styles.title}>{title}</h2>
      </div>
      {viewAllLabel && viewAllUrl && (
        <a className={styles.viewAll} href={viewAllUrl}>
          {viewAllLabel}
        </a>
      )}
    </div>
  );
};
