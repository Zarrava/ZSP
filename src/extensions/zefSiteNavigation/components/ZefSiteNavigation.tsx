import * as React from 'react';
import {
  ISharePointNavigationNode,
  isSharePointNavigationActive,
  resolveSharePointNavigationUrl
} from '../../../utils/sharePointNavigationUtils';
import { ZEF_CUSTOM_NAVBAR_ATTR } from '../sharePointChrome';
import styles from './ZefSiteNavigation.module.scss';

export interface IZefNavUserProfile {
  displayName: string;
  email?: string;
  photoUrl?: string;
}

export interface IZefSiteNavigationProps {
  siteTitle: string;
  webAbsoluteUrl: string;
  currentUrl: string;
  items: ISharePointNavigationNode[];
  userProfile: IZefNavUserProfile;
  isLoading: boolean;
  errorMessage?: string;
}

export const ZefSiteNavigation: React.FC<IZefSiteNavigationProps> = ({
  siteTitle,
  webAbsoluteUrl,
  currentUrl,
  items,
  userProfile,
  isLoading,
  errorMessage
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuId = 'zef-site-navigation-menu';
  const toggleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [currentUrl]);

  React.useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const homeUrl = webAbsoluteUrl.replace(/\/$/, '');

  const initials = userProfile.displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const renderLinks = (): React.ReactNode => {
    if (isLoading) {
      return <span className={styles.status} role="status">Loading navigation…</span>;
    }

    if (errorMessage) {
      return <span className={styles.status} role="alert">{errorMessage}</span>;
    }

    return (
      <ul className={styles.links}>
        {items.map((item) => {
          const href = resolveSharePointNavigationUrl(item.url, webAbsoluteUrl);
          const isActive = isSharePointNavigationActive(item.url, currentUrl, webAbsoluteUrl);

          return (
            <li key={item.id} className={styles.linkItem}>
              <a
                className={`${styles.link} ${isActive ? styles.linkActive : ''}`}
                href={href}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={styles.linkText}>{item.title}</span>
                {isActive && <span className={styles.activeIndicator} aria-hidden="true" />}
              </a>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={styles.shell} {...{ [ZEF_CUSTOM_NAVBAR_ATTR]: 'true' }}>
      <nav className={styles.nav} aria-label="ZEF site navigation">
        <div className={styles.inner}>
          <div className={styles.brandSection}>
            <a className={styles.brand} href={homeUrl}>
              <span className={styles.logoMark} aria-hidden="true">ZEF</span>
              <span className={styles.brandName}>{siteTitle}</span>
            </a>
          </div>

          <div className={styles.navSection} aria-label="Primary navigation">
            {renderLinks()}
          </div>

          <div className={styles.actionsSection}>
            <div
              className={styles.userArea}
              aria-label={`Signed in as ${userProfile.displayName}`}
            >
              {userProfile.photoUrl ? (
                <img
                  className={styles.avatarImage}
                  src={userProfile.photoUrl}
                  alt=""
                  aria-hidden="true"
                />
              ) : (
                <span className={styles.avatar} aria-hidden="true">{initials}</span>
              )}
              <div className={styles.userMeta}>
                <span className={styles.userName}>{userProfile.displayName}</span>
                {userProfile.email && (
                  <span className={styles.userEmail}>{userProfile.email}</span>
                )}
              </div>
            </div>

            <button
              ref={toggleRef}
              type="button"
              className={styles.menuToggle}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className={styles.menuToggleLabel}>{menuOpen ? 'Close menu' : 'Open menu'}</span>
              <span className={styles.menuToggleIcon} aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>

        <div
          id={menuId}
          className={`${styles.mobilePanel} ${menuOpen ? styles.mobilePanelOpen : ''}`}
        >
          {renderLinks()}
        </div>
      </nav>
    </div>
  );
};
