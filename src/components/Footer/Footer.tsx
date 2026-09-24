import * as React from 'react';
import { ILinkItem } from '../../models/LinkItem';
import styles from './Footer.module.scss';

export interface IFooterProps {
  links: ILinkItem[];
  brand?: string;
  context?: string;
}

export const Footer: React.FC<IFooterProps> = ({
  links,
  brand = 'ZEF Digital Workplace',
  context = 'Microsoft 365 & SharePoint'
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <span className={styles.logoMark} aria-hidden="true">ZEF</span>
          <div className={styles.brandText}>
            <span className={styles.brand}>{brand}</span>
            <span className={styles.context}>{context}</span>
          </div>
        </div>
        {links.length > 0 && (
          <nav className={styles.links} aria-label="Footer navigation">
            {links.map((link) => (
              link.url ? (
                <a key={link.id} className={styles.link} href={link.url}>
                  {link.label}
                </a>
              ) : (
                <span key={link.id} className={styles.linkDisabled}>
                  {link.label}
                </span>
              )
            ))}
          </nav>
        )}
        <span className={styles.copyright}>
          &copy; {currentYear} Zurfte Empowercare Foundation
        </span>
      </div>
    </footer>
  );
};
