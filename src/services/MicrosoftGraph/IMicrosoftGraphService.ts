import { IUserProfile } from '../../models/UserProfile';
import { IEvent } from '../../models/Event';
import { IWorkspaceItem, IWorkspaceSection } from '../../models/WorkspaceItem';

export interface IMicrosoftGraphService {
  getCurrentUser(): Promise<IUserProfile>;
  getUpcomingEvents(limit?: number): Promise<IEvent[]>;
  getMyTeams(): Promise<IWorkspaceItem[]>;
  getMyRecentDocuments(): Promise<IWorkspaceItem[]>;
  getMyTasks(): Promise<IWorkspaceItem[]>;
  getPersonalizedWorkspace(): Promise<IWorkspaceSection[]>;
  getOneDriveWebUrl(): Promise<string | undefined>;
}
