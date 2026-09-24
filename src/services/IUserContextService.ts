import { IUserProfile } from '../models/UserProfile';
import { IUserRoleContext } from '../models/IUserRoleContext';

export interface IUserContextService {
  /** Synchronous profile from SPFx page context (always available when signed in). */
  getUserProfile(): IUserProfile;

  /** Enriched profile from Microsoft Graph where permissions allow. */
  getUserProfileAsync(): Promise<IUserProfile>;

  /** Role context foundation for future personalization. */
  getRoleContext(): IUserRoleContext;
}
