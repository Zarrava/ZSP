export const formatTeamDeepLink = (template: string, teamId: string): string =>
  template.replace('{teamId}', encodeURIComponent(teamId));

export const safeGraphCall = async <T>(
  loader: () => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    return await loader();
  } catch {
    return fallback;
  }
};
