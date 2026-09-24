import * as React from 'react';
import { SectionHeader } from '../../SectionHeader/SectionHeader';
import styles from './ZefSection.module.scss';

export interface IZefSectionProps {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  id?: string;
  viewAllLabel?: string;
  viewAllUrl?: string;
}

export const ZefSection: React.FC<IZefSectionProps> = ({
  title,
  eyebrow,
  children,
  id,
  viewAllLabel,
  viewAllUrl
}) => (
  <section className={styles.section} id={id} aria-labelledby={id ? `${id}-heading` : undefined}>
    <SectionHeader
      title={title}
      eyebrow={eyebrow}
      viewAllLabel={viewAllLabel}
      viewAllUrl={viewAllUrl}
    />
    {children}
  </section>
);

