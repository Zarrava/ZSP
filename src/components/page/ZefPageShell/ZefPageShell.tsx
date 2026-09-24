import * as React from 'react';
import { useRef } from 'react';
import { Footer } from '../../Footer/Footer';
import { ILinkItem } from '../../../models/LinkItem';
import { useContainerWidth } from '../../../hooks/useContainerWidth';
import styles from './ZefPageShell.module.scss';

export interface IZefPageShellProps {
  children: React.ReactNode;
  footerLinks: ILinkItem[];
}

export const ZefPageShell: React.FC<IZefPageShellProps> = ({ children, footerLinks }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useContainerWidth(rootRef);

  return (
    <div ref={rootRef} className={styles.shell}>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.content}>
            {children}
          </div>
        </div>
      </main>
      <Footer
        links={footerLinks.filter((link) => link.id !== 'footer-m365-help')}
        brand="Zurfte Empowercare Foundation"
        context="Nonprofit organization"
      />
    </div>
  );
};

