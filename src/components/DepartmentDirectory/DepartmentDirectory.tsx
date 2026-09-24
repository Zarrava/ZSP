import * as React from 'react';
import { IDepartment } from '../../models/Department';
import { DepartmentCard } from '../DepartmentCard/DepartmentCard';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { SectionState } from '../SectionState/SectionState';
import styles from './DepartmentDirectory.module.scss';

export interface IDepartmentDirectoryProps {
  departments: IDepartment[];
  viewAllUrl?: string;
  isLoading?: boolean;
  error?: string;
}

export const DepartmentDirectory: React.FC<IDepartmentDirectoryProps> = ({
  departments,
  viewAllUrl,
  isLoading,
  error
}) => {
  const showEmpty = !isLoading && !error && departments.length === 0;

  return (
    <section className={styles.directory} id="departments" aria-labelledby="departments-heading">
      <SectionHeader
        title="Departments"
        eyebrow="Directory"
        viewAllLabel="View all"
        viewAllUrl={viewAllUrl}
      />
      <SectionState
        isLoading={isLoading}
        error={error ? 'Departments unavailable.' : undefined}
        isEmpty={showEmpty}
        emptyTitle="No departments configured"
        emptyMessage="Department cards will appear here once list managers publish them."
        emptyIconName="Org"
      />
      {!isLoading && !error && departments.length > 0 && (
        <ul className={styles.grid}>
          {departments.map((department) => (
            <li key={department.id}>
              <DepartmentCard department={department} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
