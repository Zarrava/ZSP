import * as React from 'react';
import styles from './ZefContentGrid.module.scss';

export interface IZefContentGridProps {
  children: React.ReactNode;
}

export const ZefContentGrid: React.FC<IZefContentGridProps> = ({ children }) => (
  <div className={styles.grid}>{children}</div>
);
