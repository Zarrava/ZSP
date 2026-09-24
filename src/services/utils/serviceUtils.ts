import { IWorkplaceServices } from '../IWorkplaceServices';

export const shouldUseMockData = (services: IWorkplaceServices): boolean =>
  services.isLocalDev && services.config.useMockDataInLocalDev;

export const formatTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

export const formatDateOnly = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toISOString().split('T')[0];
};

export const safeJsonParse = <T>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return value as T;
};
