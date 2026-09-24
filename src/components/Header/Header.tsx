import * as React from 'react';
import { SearchBox } from '@fluentui/react/lib/SearchBox';
import { SearchPanel } from '../SearchPanel/SearchPanel';
import { IWorkplaceSearchResult } from '../../utils/workplaceSearchUtils';
import styles from './Header.module.scss';

export interface IHeaderProps {
  searchQuery: string;
  searchResults: IWorkplaceSearchResult[];
  isSearchOpen: boolean;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  onSearchSelect: (result: IWorkplaceSearchResult) => void;
}

export const Header: React.FC<IHeaderProps> = ({
  searchQuery,
  searchResults,
  isSearchOpen,
  onSearchChange,
  onSearchClear,
  onSearchSelect
}) => {
  const searchPanelId = 'zef-workplace-search-results';

  const handleSearch = (_event?: React.ChangeEvent<HTMLInputElement>, newValue?: string): void => {
    onSearchChange(newValue ?? '');
  };

  return (
    <section className={styles.searchSection} aria-label="Digital Workplace search">
      <div className={styles.inner}>
        <p className={styles.sectionLabel}>Digital Workplace</p>
        <div className={styles.searchWrap} role="search">
          <div className={styles.searchField}>
            <SearchBox
              placeholder="Search workplace…"
              ariaLabel="Search workplace content"
              aria-expanded={isSearchOpen}
              aria-controls={searchPanelId}
              value={searchQuery}
              onChange={handleSearch}
              onClear={onSearchClear}
              underlined={false}
              className={styles.searchInput}
            />
            <span className={styles.searchShortcut} aria-hidden="true">⌘K</span>
          </div>
          <SearchPanel
            panelId={searchPanelId}
            query={searchQuery}
            results={searchResults}
            isOpen={isSearchOpen}
            onSelect={onSearchSelect}
          />
        </div>
      </div>
    </section>
  );
};
