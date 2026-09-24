import * as React from 'react';
import styles from './ZefPageHero.module.scss';

export interface IZefPageHeroProps {
  eyebrow: string;
  headline: string;
  intro: string;
  id?: string;
}

export const ZefPageHero: React.FC<IZefPageHeroProps> = ({
  eyebrow,
  headline,
  intro,
  id
}) => (
  <section className={styles.hero} aria-labelledby={id}>
    <div className={styles.glow} aria-hidden="true" />
    <div className={styles.content}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 id={id} className={styles.headline}>
          <span className={styles.headlineLine}>{headline}</span>
        </h1>
        <p className={styles.intro}>{intro}</p>
      </div>
    </div>
  </section>
);
