import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import { IDepartment } from '../../models/Department';
import styles from './DepartmentCard.module.scss';

export interface IDepartmentCardProps {
  department: IDepartment;
}

export const DepartmentCard: React.FC<IDepartmentCardProps> = ({ department }) => {
  const hasSharePoint = !!department.sharePointSiteUrl;
  const hasTeams = !!department.teamsUrl;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          {department.iconName ? (
            <Icon iconName={department.iconName} className={styles.deptIcon} aria-hidden="true" />
          ) : (
            <Icon iconName="Org" className={styles.deptIcon} aria-hidden="true" />
          )}
        </div>
        <div className={styles.text}>
          <h3 className={styles.name}>{department.name}</h3>
          {department.description && (
            <p className={styles.description}>{department.description}</p>
          )}
        </div>
      </div>

      {(hasSharePoint || hasTeams) && (
        <div className={styles.actions}>
          {hasSharePoint && (
            <a
              className={styles.actionLink}
              href={department.sharePointSiteUrl}
              aria-label={`Open ${department.name} SharePoint site`}
              title="SharePoint"
            >
              <Icon iconName="SharepointLogo" aria-hidden="true" />
              <span>SharePoint</span>
            </a>
          )}
          {hasTeams && (
            <a
              className={`${styles.actionLink} ${styles.actionTeams}`}
              href={department.teamsUrl}
              aria-label={`Open ${department.name} in Teams`}
              title="Teams"
            >
              <Icon iconName="TeamsLogo" aria-hidden="true" />
              <span>Teams</span>
            </a>
          )}
        </div>
      )}
    </article>
  );
};
