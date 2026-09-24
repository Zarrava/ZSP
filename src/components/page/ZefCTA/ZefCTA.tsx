import * as React from 'react';
import { IZefCtaLink } from '../../../content/zefOrganizationContent';
import styles from './ZefCTA.module.scss';

export interface IZefCTAProps {
  title: string;
  description: string;
  links: readonly IZefCtaLink[];
}

export const ZefCTA: React.FC<IZefCTAProps> = ({ title, description, links }) => (
  <section className={styles.cta} aria-label={title}>
    <div className={styles.copy}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
    <div className={styles.actions}>
      {links.map((link) => (
        <a key={link.url} className={styles.link} href={link.url}>
          <span className={styles.linkLabel}>{link.label}</span>
          {link.description && (
            <span className={styles.linkDescription}>{link.description}</span>
          )}
        </a>
      ))}
    </div>
  </section>
);
