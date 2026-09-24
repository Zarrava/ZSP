import { useEffect, useState } from 'react';
import { IWorkplaceServices } from '../services/IWorkplaceServices';
import { IUserProfile } from '../models/UserProfile';
import { IQuickAccessItem } from '../models/QuickAccessItem';
import { IWorkspaceSection } from '../models/WorkspaceItem';
import { IAnnouncement } from '../models/Announcement';
import { IEvent } from '../models/Event';
import { IDepartment } from '../models/Department';
import { IResource } from '../models/Resource';
import {
  IAsyncDataState,
  idleState,
  loadingState,
  successState,
  errorState
} from '../models/AsyncDataState';

export interface IWorkplaceData {
  userProfile: IAsyncDataState<IUserProfile>;
  quickAccess: IAsyncDataState<IQuickAccessItem[]>;
  workspace: IAsyncDataState<IWorkspaceSection[]>;
  announcements: IAsyncDataState<IAnnouncement[]>;
  events: IAsyncDataState<IEvent[]>;
  departments: IAsyncDataState<IDepartment[]>;
  resources: IAsyncDataState<IResource[]>;
}

const loadSection = async <T>(
  loader: () => Promise<T>,
  fallback: T,
  setState: (state: IAsyncDataState<T>) => void
): Promise<void> => {
  setState(loadingState(fallback));
  try {
    const data = await loader();
    setState(successState(data));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load data';
    setState(errorState(fallback, message));
  }
};

export const useWorkplaceData = (services: IWorkplaceServices): IWorkplaceData => {
  const [userProfile, setUserProfile] = useState(idleState<IUserProfile>(services.userContext.getUserProfile()));
  const [quickAccess, setQuickAccess] = useState(idleState<IQuickAccessItem[]>([]));
  const [workspace, setWorkspace] = useState(idleState<IWorkspaceSection[]>([]));
  const [announcements, setAnnouncements] = useState(idleState<IAnnouncement[]>([]));
  const [events, setEvents] = useState(idleState<IEvent[]>([]));
  const [departments, setDepartments] = useState(idleState<IDepartment[]>([]));
  const [resources, setResources] = useState(idleState<IResource[]>([]));

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      setUserProfile(loadingState(services.userContext.getUserProfile()));

      try {
        const profile = await services.userContext.getUserProfileAsync();
        if (!cancelled) {
          setUserProfile(successState(profile));
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Unable to load user profile';
          setUserProfile(errorState(services.userContext.getUserProfile(), message));
        }
      }

      await Promise.all([
        loadSection(() => services.sharePoint.getQuickAccessItems(), [], setQuickAccess),
        loadSection(() => services.graph.getPersonalizedWorkspace(), [], setWorkspace),
        loadSection(() => services.sharePoint.getAnnouncements(), [], setAnnouncements),
        loadSection(() => services.graph.getUpcomingEvents(5), [], setEvents),
        loadSection(() => services.sharePoint.getDepartments(), [], setDepartments),
        loadSection(() => services.sharePoint.getResources(), [], setResources)
      ]);
    };

    run().catch(() => {
      // Individual section errors are handled in loadSection.
    });

    return () => {
      cancelled = true;
    };
  }, [services]);

  return {
    userProfile,
    quickAccess,
    workspace,
    announcements,
    events,
    departments,
    resources
  };
};
