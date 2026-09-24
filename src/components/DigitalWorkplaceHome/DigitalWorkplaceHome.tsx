import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import { Header } from '../Header/Header';
import { Hero } from '../Hero/Hero';
import { QuickAccess } from '../QuickAccess/QuickAccess';
import { Announcements } from '../Announcements/Announcements';
import { UpcomingEvents } from '../UpcomingEvents/UpcomingEvents';
import { MyWorkspace } from '../MyWorkspace/MyWorkspace';
import { DepartmentDirectory } from '../DepartmentDirectory/DepartmentDirectory';
import { Resources } from '../Resources/Resources';
import { Footer } from '../Footer/Footer';
import { WorkplaceRail } from '../WorkplaceRail/WorkplaceRail';
import { IWorkplaceServices } from '../../services/IWorkplaceServices';
import { useWorkplaceData } from '../../hooks/useWorkplaceData';
import { buildHeroMetrics } from '../../utils/heroMetricsUtils';
import {
  IWorkplaceSearchResult,
  searchWorkplaceContent
} from '../../utils/workplaceSearchUtils';
import styles from './DigitalWorkplaceHome.module.scss';

export interface IDigitalWorkplaceHomeProps {
  services: IWorkplaceServices;
}

/** Regression marker: hero spans the full app width above the main+rail grid. */
export const DIGITAL_WORKPLACE_LAYOUT = {
  heroPlacement: 'above-page-layout' as const
};

const SEARCH_DEBOUNCE_MS = 250;

export const DigitalWorkplaceHome: React.FC<IDigitalWorkplaceHomeProps> = ({ services }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useContainerWidth(rootRef);

  const data = useWorkplaceData(services);
  const heroMetrics = useMemo(() => buildHeroMetrics(data), [data]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const searchResults = useMemo(() => {
    if (
      data.announcements.status !== 'success'
      && data.departments.status !== 'success'
      && data.resources.status !== 'success'
    ) {
      return [];
    }

    return searchWorkplaceContent(debouncedQuery, {
      announcements: data.announcements.status === 'success' ? data.announcements.data : [],
      departments: data.departments.status === 'success' ? data.departments.data : [],
      resources: data.resources.status === 'success' ? data.resources.data : []
    });
  }, [debouncedQuery, data.announcements, data.departments, data.resources]);

  const handleSearchChange = useCallback((query: string): void => {
    setSearchQuery(query);
    setIsSearchOpen(query.trim().length > 0);
  }, []);

  const handleSearchClear = useCallback((): void => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsSearchOpen(false);
  }, []);

  const handleSearchSelect = useCallback((result: IWorkplaceSearchResult): void => {
    if (result.sectionAnchor) {
      const section = document.getElementById(result.sectionAnchor);
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    handleSearchClear();
  }, [handleSearchClear]);

  const profile = data.userProfile.data;
  return (
    <div ref={rootRef} className={styles.home}>
      <Header
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearchOpen={isSearchOpen}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        onSearchSelect={handleSearchSelect}
      />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.sectionHero}>
            <Hero userDisplayName={profile.displayName} metrics={heroMetrics} />
          </div>

          <div className={styles.pageLayout}>
            <div className={styles.mainColumn}>
              <div className={styles.sectionQuickAccess}>
                <QuickAccess
                  items={data.quickAccess.data}
                  isLoading={data.quickAccess.status === 'loading'}
                  error={data.quickAccess.error}
                />
              </div>

              <div className={styles.sectionWorkspace}>
                <MyWorkspace
                  sections={data.workspace.data}
                  isLoading={data.workspace.status === 'loading'}
                  error={data.workspace.error}
                />
              </div>

              <div className={styles.sectionInfoGrid}>
                <div className={styles.infoGrid}>
                  <Announcements
                    announcements={data.announcements.data}
                    viewAllUrl={services.config.navigation.announcementsViewAllUrl}
                    isLoading={data.announcements.status === 'loading'}
                    error={data.announcements.error}
                  />
                  <UpcomingEvents
                    events={data.events.data}
                    viewAllUrl={services.config.navigation.eventsViewAllUrl}
                    isLoading={data.events.status === 'loading'}
                    error={data.events.error}
                  />
                </div>
              </div>

              <div className={styles.sectionDepartments}>
                <DepartmentDirectory
                  departments={data.departments.data}
                  viewAllUrl={services.config.navigation.departmentsViewAllUrl}
                  isLoading={data.departments.status === 'loading'}
                  error={data.departments.error}
                />
              </div>

              <div className={styles.sectionResources}>
                <Resources
                  resources={data.resources.data}
                  viewAllUrl={services.config.navigation.resourcesViewAllUrl}
                  isLoading={data.resources.status === 'loading'}
                  error={data.resources.error}
                />
              </div>
            </div>

            <div className={styles.sectionRail}>
              <WorkplaceRail
                events={data.events.data}
                isLoading={data.events.status === 'loading'}
                error={data.events.error}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer links={services.config.footer.links} />
    </div>
  );
};
