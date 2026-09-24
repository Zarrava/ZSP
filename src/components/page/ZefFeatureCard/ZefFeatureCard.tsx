import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import styles from './ZefFeatureCard.module.scss';

export interface IZefFeatureCardProps {
  title: string;
  description: string;
  iconName?: string;
  highlights?: readonly string[];
}

export const ZefFeatureCard: React.FC<IZefFeatureCardProps> = ({
  title,
  description,
  iconName = 'CircleRing',
  highlights
}) => (
  <article className={styles.card}>
    <div className={styles.iconWrap} aria-hidden="true">
      <Icon iconName={iconName} />
    </div>
    <h3 className={styles.title}>{title}</h3>
    <p className={styles.description}>{description}</p>
    {highlights && highlights.length > 0 && (
      <ul className={styles.list}>
        {highlights.map((item) => (
          <li key={item} className={styles.listItem}>{item}</li>
        ))}
      </ul>
    )}
  </article>
);
