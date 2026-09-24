import { IHeroMetric } from '../components/Hero/Hero';
import { IWorkplaceData } from '../hooks/useWorkplaceData';

const countOrLoading = (
  status: string,
  count: number
): Pick<IHeroMetric, 'value' | 'isLoading'> => {
  if (status === 'loading') {
    return { value: '', isLoading: true };
  }
  if (status === 'error') {
    return { value: '—' };
  }
  return { value: String(count) };
};

const extractTasksCount = (title: string): string | undefined => {
  const match = /(\d+)\s+outstanding/i.exec(title);
  if (match) {
    return match[1];
  }
  if (/no outstanding tasks/i.test(title)) {
    return '0';
  }
  return undefined;
};

/**
 * Builds hero dashboard metrics from already-loaded workplace data.
 * Never invents values — only derives from existing application state.
 */
export const buildHeroMetrics = (data: IWorkplaceData): IHeroMetric[] => {
  const announcements = countOrLoading(
    data.announcements.status,
    data.announcements.data.length
  );

  const events = countOrLoading(
    data.events.status,
    data.events.data.length
  );

  let teamsMetric: Pick<IHeroMetric, 'value' | 'isLoading'>;
  if (data.workspace.status === 'loading') {
    teamsMetric = { value: '', isLoading: true };
  } else if (data.workspace.status === 'error') {
    teamsMetric = { value: '—' };
  } else {
    const teamsSection = data.workspace.data.find((section) => section.id === 'ws-teams');
    const primaryTeam = teamsSection?.items[0];
    const hasTeam = primaryTeam !== undefined && primaryTeam.id !== 'teams-empty';
    teamsMetric = { value: hasTeam ? '1' : '0' };
  }

  let tasksMetric: Pick<IHeroMetric, 'value' | 'isLoading'>;
  if (data.workspace.status === 'loading') {
    tasksMetric = { value: '', isLoading: true };
  } else if (data.workspace.status === 'error') {
    tasksMetric = { value: '—' };
  } else {
    const tasksSection = data.workspace.data.find((section) => section.id === 'ws-tasks');
    const primaryTask = tasksSection?.items[0];
    if (!primaryTask || primaryTask.id === 'tasks-unavailable') {
      tasksMetric = { value: '—' };
    } else {
      const extracted = extractTasksCount(primaryTask.title);
      tasksMetric = { value: extracted ?? '—' };
    }
  }

  return [
    { label: 'Announcements', ...announcements },
    { label: 'Upcoming events', ...events },
    { label: 'Teams', ...teamsMetric },
    { label: 'Open tasks', ...tasksMetric }
  ];
};
