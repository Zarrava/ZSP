import * as React from 'react';
import { useMemo } from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { IResource } from '../../models/Resource';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { SectionState } from '../SectionState/SectionState';
import styles from './Resources.module.scss';

export interface IResourcesProps {
  resources: IResource[];
  viewAllUrl?: string;
  isLoading?: boolean;
  error?: string;
  title?: string;
  eyebrow?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  noteUnverifiedLinks?: boolean;
}

interface IResourceGroup {
  category: string;
  items: IResource[];
}

const groupResourcesByCategory = (resources: IResource[]): IResourceGroup[] => {
  const groups = new Map<string, IResource[]>();

  resources.forEach((resource) => {
    const category = resource.category?.trim() || 'General';
    const existing = groups.get(category) || [];
    existing.push(resource);
    groups.set(category, existing);
  });

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({ category, items }));
};

const ResourceCard: React.FC<{ resource: IResource; noteUnverifiedLinks?: boolean }> = ({
  resource,
  noteUnverifiedLinks
}) => {
  const content = (
    <>
      <div className={styles.resourceIconWrap}>
        {resource.iconName ? (
          <Icon iconName={resource.iconName} className={styles.icon} aria-hidden="true" />
        ) : (
          <Icon iconName="Link" className={styles.icon} aria-hidden="true" />
        )}
      </div>
      <div className={styles.resourceBody}>
        <span className={styles.title}>{resource.title}</span>
        {resource.description && (
          <span className={styles.description}>{resource.description}</span>
        )}
        {resource.audience && (
          <span className={styles.audience}>{resource.audience}</span>
        )}
        {noteUnverifiedLinks && !resource.url && (
          <span className={styles.description}>
            Coming soon. The resource will be added when a verified destination is available.
          </span>
        )}
      </div>
      <Icon iconName="OpenInNewWindow" className={styles.externalIcon} aria-hidden="true" />
    </>
  );

  if (resource.url) {
    return (
      <a className={styles.card} href={resource.url}>
        {content}
      </a>
    );
  }

  return (
    <div className={`${styles.card} ${styles.cardStatic}`} aria-disabled="true">
      {content}
    </div>
  );
};

export const Resources: React.FC<IResourcesProps> = ({
  resources,
  viewAllUrl,
  isLoading,
  error,
  title = 'Resources',
  eyebrow = 'Library',
  emptyTitle = 'No resources are published yet',
  emptyMessage = 'Check back here for ZEF guides, policies, templates, and training materials.',
  noteUnverifiedLinks = false
}) => {
  const showEmpty = !isLoading && !error && resources.length === 0;
  const groupedResources = useMemo(
    () => groupResourcesByCategory(resources),
    [resources]
  );
  const headingId = `${title.toLowerCase().replace(/\s+/g, '-')}-heading`;

  return (
    <section className={styles.resources} id="resources" aria-labelledby={headingId}>
      <SectionHeader
        title={title}
        eyebrow={eyebrow}
        viewAllLabel="View all"
        viewAllUrl={viewAllUrl}
      />
      <SectionState
        isLoading={isLoading}
        error={error ? 'Resources unavailable.' : undefined}
        isEmpty={showEmpty}
        emptyTitle={emptyTitle}
        emptyMessage={emptyMessage}
        emptyIconName="Library"
      />
      {!isLoading && !error && resources.length > 0 && (
        <div className={styles.groups}>
          {groupedResources.map((group) => (
            <div key={group.category} className={styles.group}>
              <h3 className={styles.groupTitle}>{group.category}</h3>
              <ul className={styles.list}>
                {group.items.map((resource) => (
                  <li key={resource.id}>
                    <ResourceCard resource={resource} noteUnverifiedLinks={noteUnverifiedLinks} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
