/**
 * Microsoft Graph endpoints and M365 destination URLs.
 * Tenant-specific OneDrive URLs are derived at runtime when not configured.
 */
export interface IGraphEndpointsConfig {
  currentUser: string;
  userPhoto: string;
  events: string;
  joinedTeams: string;
  recentDocuments: string;
  todoLists: string;
  drive: string;
}

export interface IGraphConfig {
  endpoints: IGraphEndpointsConfig;
  /** Deep-link template — `{teamId}` is replaced at runtime. */
  teamDeepLinkTemplate: string;
  tasksUrl: string;
  calendarUrl: string;
  /** Empty string means resolve via Graph `/me/drive` at runtime. */
  oneDriveUrl: string;
}
