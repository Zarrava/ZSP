import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { IZefWorkplaceConfig } from '../../config/IZefWorkplaceConfig';
import { IUserProfile } from '../../models/UserProfile';
import { IEvent } from '../../models/Event';
import { IWorkspaceItem, IWorkspaceSection } from '../../models/WorkspaceItem';
import { IMicrosoftGraphService } from './IMicrosoftGraphService';
import { formatDateOnly, formatTime } from '../utils/serviceUtils';
import { formatTeamDeepLink, safeGraphCall } from '../utils/graphUtils';

interface IGraphUser {
  id?: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
}

interface IGraphEvent {
  id: string;
  subject?: string;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  location?: { displayName?: string };
  organizer?: { emailAddress?: { name?: string } };
  onlineMeeting?: { joinUrl?: string };
  webLink?: string;
}

interface IGraphTeam {
  id: string;
  displayName?: string;
}

interface IGraphDriveItem {
  id: string;
  name?: string;
  webUrl?: string;
  lastModifiedDateTime?: string;
}

interface IGraphTodoTask {
  id: string;
  title?: string;
  status?: string;
}

interface IGraphTodoList {
  id: string;
  displayName?: string;
  tasks?: { value?: IGraphTodoTask[] };
}

export class MicrosoftGraphService implements IMicrosoftGraphService {
  public constructor(
    private readonly _context: WebPartContext,
    private readonly _config: IZefWorkplaceConfig
  ) {}

  public async getCurrentUser(): Promise<IUserProfile> {
    const client = await this._context.msGraphClientFactory.getClient('3');
    const endpoints = this._config.graph.endpoints;
    const user = await client
      .api(endpoints.currentUser)
      .select('id,displayName,mail,userPrincipalName,jobTitle')
      .get() as IGraphUser;

    let photoUrl: string | undefined;
    try {
      const photoBlob = await client.api(endpoints.userPhoto).get() as Blob;
      if (photoBlob) {
        photoUrl = URL.createObjectURL(photoBlob);
      }
    } catch {
      photoUrl = undefined;
    }

    return {
      displayName: user.displayName || '',
      email: user.mail || user.userPrincipalName,
      jobTitle: user.jobTitle,
      userId: user.id,
      photoUrl
    };
  }

  public async getUpcomingEvents(limit: number = 5): Promise<IEvent[]> {
    const client = await this._context.msGraphClientFactory.getClient('3');
    const now = new Date().toISOString();
    const response = await client
      .api(this._config.graph.endpoints.events)
      .filter(`start/dateTime ge '${now}'`)
      .orderby('start/dateTime')
      .top(limit)
      .select('id,subject,start,end,location,organizer,onlineMeeting,webLink')
      .get() as { value?: IGraphEvent[] };

    return (response.value || []).map((item) => this._mapGraphEvent(item));
  }

  public async getMyTeams(): Promise<IWorkspaceItem[]> {
    const client = await this._context.msGraphClientFactory.getClient('3');
    const response = await client
      .api(this._config.graph.endpoints.joinedTeams)
      .get() as { value?: IGraphTeam[] };
    const teams = response.value || [];

    if (teams.length === 0) {
      return [];
    }

    return teams.slice(0, 1).map((team) => ({
      id: team.id,
      title: team.displayName || 'Team',
      url: formatTeamDeepLink(this._config.graph.teamDeepLinkTemplate, team.id)
    }));
  }

  public async getMyRecentDocuments(): Promise<IWorkspaceItem[]> {
    const client = await this._context.msGraphClientFactory.getClient('3');
    const response = await client
      .api(this._config.graph.endpoints.recentDocuments)
      .top(1)
      .get() as { value?: IGraphDriveItem[] };
    const items = response.value || [];

    if (items.length === 0) {
      return [];
    }

    const recent = items[0];
    return [{
      id: recent.id,
      title: recent.name || 'Recent document',
      description: recent.lastModifiedDateTime ? 'Recently modified' : undefined,
      url: recent.webUrl
    }];
  }

  public async getMyTasks(): Promise<IWorkspaceItem[]> {
    const client = await this._context.msGraphClientFactory.getClient('3');
    const listsResponse = await client
      .api(this._config.graph.endpoints.todoLists)
      .get() as { value?: IGraphTodoList[] };
    const lists = listsResponse.value || [];

    let outstanding = 0;
    for (const list of lists.slice(0, 3)) {
      const tasksResponse = await client
        .api(`${this._config.graph.endpoints.todoLists}/${list.id}/tasks`)
        .filter("status ne 'completed'")
        .top(50)
        .get() as { value?: IGraphTodoTask[] };
      outstanding += (tasksResponse.value || []).length;
    }

    if (outstanding === 0) {
      return [{ id: 'tasks-empty', title: 'No outstanding tasks' }];
    }

    return [{
      id: 'tasks-summary',
      title: `${outstanding} outstanding task${outstanding === 1 ? '' : 's'}`,
      url: this._config.graph.tasksUrl
    }];
  }

  public async getPersonalizedWorkspace(): Promise<IWorkspaceSection[]> {
    const [teams, documents, events, tasks] = await Promise.all([
      safeGraphCall(() => this.getMyTeams(), [] as IWorkspaceItem[]),
      safeGraphCall(() => this.getMyRecentDocuments(), [] as IWorkspaceItem[]),
      safeGraphCall(() => this.getUpcomingEvents(1), [] as IEvent[]),
      safeGraphCall(() => this.getMyTasks(), [{ id: 'tasks-unavailable', title: 'Tasks unavailable' }])
    ]);

    const sections: IWorkspaceSection[] = [];

    sections.push({
      id: 'ws-teams',
      title: 'Teams',
      items: teams.length > 0 ? teams : [{ id: 'teams-empty', title: 'No teams available' }]
    });

    sections.push({
      id: 'ws-docs',
      title: 'Documents',
      items: documents.length > 0 ? documents : [{ id: 'docs-empty', title: 'No recent documents' }]
    });

    const calendarItems: IWorkspaceItem[] = events.length > 0
      ? [{
        id: events[0].id,
        title: `${events[0].title} · ${events[0].time}`,
        url: events[0].url || events[0].meetingUrl || this._config.graph.calendarUrl
      }]
      : [{ id: 'cal-empty', title: 'No upcoming events' }];

    sections.push({
      id: 'ws-calendar',
      title: 'Calendar',
      items: calendarItems
    });

    sections.push({
      id: 'ws-tasks',
      title: 'Tasks',
      items: tasks
    });

    return sections;
  }

  public async getOneDriveWebUrl(): Promise<string | undefined> {
    if (this._config.graph.oneDriveUrl) {
      return this._config.graph.oneDriveUrl;
    }

    try {
      const client = await this._context.msGraphClientFactory.getClient('3');
      const drive = await client
        .api(this._config.graph.endpoints.drive)
        .select('webUrl')
        .get() as { webUrl?: string };
      return drive.webUrl;
    } catch {
      return undefined;
    }
  }

  private _mapGraphEvent(item: IGraphEvent): IEvent {
    const start = item.start?.dateTime || '';
    const end = item.end?.dateTime || '';
    return {
      id: item.id,
      title: item.subject || 'Event',
      date: formatDateOnly(start),
      time: formatTime(start),
      endTime: end ? formatTime(end) : undefined,
      location: item.location?.displayName,
      organizer: item.organizer?.emailAddress?.name,
      url: item.webLink,
      meetingUrl: item.onlineMeeting?.joinUrl
    };
  }
}
