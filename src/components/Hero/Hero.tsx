import * as React from 'react';
import { getFirstName, getTimeBasedGreeting } from '../../utils/greetingUtils';
import styles from './Hero.module.scss';

export interface IHeroMetric {
  label: string;
  value: string;
  isLoading?: boolean;
}

export interface IHeroProps {
  userDisplayName?: string;
  metrics?: IHeroMetric[];
}

export const Hero: React.FC<IHeroProps> = ({ userDisplayName, metrics }) => {
  const greeting = getTimeBasedGreeting();
  const firstName = userDisplayName ? getFirstName(userDisplayName) : '';
  const visibleMetrics = metrics?.filter((metric) => metric.value !== undefined) ?? [];
  const [featuredMetric, ...supportingMetrics] = visibleMetrics;

  const contextLine = firstName
    ? `${greeting}, ${firstName} — here's what's happening across ZEF today.`
    : `${greeting} — here's what's happening across ZEF today.`;

  const renderMetric = (metric: IHeroMetric, featured?: boolean): React.ReactNode => (
    <div className={featured ? styles.metricFeatured : styles.metricSupport}>
      <span className={styles.metricLabel}>{metric.label}</span>
      {metric.isLoading ? (
        <span className={styles.metricSkeleton} aria-hidden="true" />
      ) : (
        <span className={featured ? styles.metricValueFeatured : styles.metricValue}>
          {metric.value}
        </span>
      )}
    </div>
  );

  return (
    <section className={styles.hero} id="home" aria-labelledby="welcome-heading">
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.greetingBlock}>
          <p className={styles.eyebrow}>ZEF Digital Workplace</p>
          <h1 id="welcome-heading" className={styles.headline}>
            <span className={styles.headlineLine}>Your work.</span>
            <span className={styles.headlineLine}>Your people.</span>
            <span className={styles.headlineLineAccent}>Your workspace.</span>
          </h1>
          <p className={styles.subline}>{contextLine}</p>
        </div>

        {visibleMetrics.length > 0 && (
          <div className={styles.metricsBlock} aria-label="Dashboard summary">
            {featuredMetric && (
              <div className={styles.metricPrimary}>
                {renderMetric(featuredMetric, true)}
              </div>
            )}
            {supportingMetrics.length > 0 && (
              <ul className={styles.metricsSupporting}>
                {supportingMetrics.map((metric) => (
                  <li key={metric.label} className={styles.metricItem}>
                    {renderMetric(metric)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
