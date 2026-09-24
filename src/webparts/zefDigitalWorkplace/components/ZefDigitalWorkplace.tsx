import * as React from 'react';
import styles from './ZefDigitalWorkplace.module.scss';
import type { IZefDigitalWorkplaceProps } from './IZefDigitalWorkplaceProps';
import { ZefSitePageRouter } from '../../../components/pages/ZefSitePageRouter';
import { normalizeExperienceMode } from '../../../utils/sitePageUtils';

export default class ZefDigitalWorkplace extends React.Component<IZefDigitalWorkplaceProps> {
  public render(): React.ReactElement<IZefDigitalWorkplaceProps> {
    const pagePath = this.props.pagePath
      || (typeof window !== 'undefined' ? window.location.pathname : '');

    return (
      <section className={styles.zefDigitalWorkplace} aria-label="ZEF Digital Workplace">
        <ZefSitePageRouter
          services={this.props.services}
          experienceMode={normalizeExperienceMode(this.props.experienceMode)}
          pagePath={pagePath}
        />
      </section>
    );
  }
}
