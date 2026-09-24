import * as React from 'react';
import styles from './ZefCard.module.scss';

export interface IZefCardProps {
  title: string;
  children: React.ReactNode;
}

export const ZefCard: React.FC<IZefCardProps> = ({ title, children }) => (
  <article className={styles.card}>
    <h3 className={styles.title}>{title}</h3>
    <div className={styles.body}>{children}</div>
  </article>
);
