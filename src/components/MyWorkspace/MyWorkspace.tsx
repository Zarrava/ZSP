import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { IWorkspaceSection } from '../../models/WorkspaceItem';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { SectionState } from '../SectionState/SectionState';
import styles from './MyWorkspace.module.scss';

export interface IMyWorkspaceProps {
  sections: IWorkspaceSection[];
  isLoading?: boolean;
  error?: string;
}

const SECTION_ICONS: Record<string, string> = {
  'ws-teams': 'TeamsLogo',
  'ws-docs': 'Folder',
  'ws-calendar': 'Calendar',
  'ws-tasks': 'TaskSolid'
};

const SECTION_ACCENTS: Record<string, string> = {
  'ws-teams': styles.accentTeams,
  'ws-docs': styles.accentDocs,
  'ws-calendar': styles.accentCalendar,
  'ws-tasks': styles.accentTasks
};

const WorkspaceModule: React.FC<{ section: IWorkspaceSection }> = ({ section }) => {
  const primaryItem = section.items[0];
  if (!primaryItem) {
    return null;
  }

  const iconName = SECTION_ICONS[section.id] || 'OpenFolderHorizontal';
  const accentClass = SECTION_ACCENTS[section.id] || styles.accentDefault;
  const isStatic = !primaryItem.url;

  const content = (
    <>
      <div className={`${styles.moduleIcon} ${accentClass}`}>
        <Icon iconName={iconName} aria-hidden="true" />
      </div>
      <div className={styles.moduleBody}>
        <span className={styles.moduleLabel}>{section.title}</span>
        <span className={styles.moduleValue}>{primaryItem.title}</span>
        {primaryItem.description && (
          <span className={styles.moduleMeta}>{primaryItem.description}</span>
        )}
      </div>
      {!isStatic && (
        <Icon iconName="ChevronRight" className={styles.chevron} aria-hidden="true" />
      )}
    </>
  );

  if (primaryItem.url) {
    return (
      <a className={styles.module} href={primaryItem.url}>
        {content}
      </a>
    );
  }

  return (
    <div className={`${styles.module} ${styles.moduleStatic}`} aria-disabled="true">
      {content}
    </div>
  );
};

export const MyWorkspace: React.FC<IMyWorkspaceProps> = ({
  sections,
  isLoading,
  error
}) => {
  const showEmpty = !isLoading && !error && sections.length === 0;

  return (
    <section className={styles.myWorkspace} id="workspace" aria-labelledby="workspace-heading">
      <SectionHeader title="My Workspace" eyebrow="Personal" />
      <SectionState
        isLoading={isLoading}
        error={error ? 'Workspace unavailable. Try again later.' : undefined}
        isEmpty={showEmpty}
        emptyTitle="Your workspace is empty"
        emptyMessage="Teams, documents, calendar, and tasks will appear here when available."
        emptyIconName="ContactCard"
      />
      {!isLoading && !error && sections.length > 0 && (
        <div className={styles.grid}>
          {sections.map((section) => (
            <WorkspaceModule key={section.id} section={section} />
          ))}
        </div>
      )}
    </section>
  );
};
