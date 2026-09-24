import * as React from 'react';
import {
  getWorkplaceSearchTypeLabel,
  IWorkplaceSearchResult
} from '../../utils/workplaceSearchUtils';
import styles from './SearchPanel.module.scss';

export interface ISearchPanelProps {
  query: string;
  results: IWorkplaceSearchResult[];
  isOpen: boolean;
  onSelect: (result: IWorkplaceSearchResult) => void;
  panelId: string;
}

const SearchResultItem: React.FC<{
  result: IWorkplaceSearchResult;
  onSelect: (result: IWorkplaceSearchResult) => void;
}> = ({ result, onSelect }) => {
  const content = (
    <>
      <span className={styles.type}>{getWorkplaceSearchTypeLabel(result.type)}</span>
      <span className={styles.title}>{result.title}</span>
      {result.subtitle && <span className={styles.subtitle}>{result.subtitle}</span>}
    </>
  );

  const handleClick = (): void => {
    onSelect(result);
  };

  if (result.url) {
    return (
      <a
        className={styles.item}
        href={result.url}
        onClick={handleClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.item} ${styles.itemStatic}`}
      onClick={handleClick}
    >
      {content}
    </button>
  );
};

export const SearchPanel: React.FC<ISearchPanelProps> = ({
  query,
  results,
  isOpen,
  onSelect,
  panelId
}) => {
  if (!isOpen) {
    return null;
  }

  const trimmed = query.trim();
  const showHint = trimmed.length > 0 && trimmed.length < 2;
  const showEmpty = trimmed.length >= 2 && results.length === 0;

  return (
    <div
      id={panelId}
      className={styles.panel}
      role="region"
      aria-label="Search results"
    >
      {showHint && (
        <p className={styles.hint}>Type at least 2 characters to search workplace content.</p>
      )}
      {showEmpty && (
        <p className={styles.empty}>No matching announcements, departments, or resources.</p>
      )}
      {results.length > 0 && (
        <ul className={styles.list}>
          {results.map((result) => (
            <li key={result.id}>
              <SearchResultItem result={result} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
