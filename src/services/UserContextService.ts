import type { WebPartContext } from '@microsoft/sp-webpart-base';
import { IZefWorkplaceConfig } from '../config/IZefWorkplaceConfig';
import { IUserProfile } from '../models/UserProfile';
import { emptyRoleContext, IUserRoleContext } from '../models/IUserRoleContext';
import { IUserContextService } from './IUserContextService';
import { IMicrosoftGraphService } from './MicrosoftGraph/IMicrosoftGraphService';

export class UserContextService implements IUserContextService {
  private _cachedProfile: IUserProfile | undefined;

  public constructor(
    private readonly _context: WebPartContext,
    private readonly _graphService: IMicrosoftGraphService,
    private readonly _config: IZefWorkplaceConfig
  ) {}

  public getUserProfile(): IUserProfile {
    const user = this._context.pageContext.user;
    return {
      displayName: user.displayName || 'User',
      email: user.email,
      jobTitle: undefined,
      loginName: user.loginName,
      userId: user.loginName
    };
  }

  public async getUserProfileAsync(): Promise<IUserProfile> {
    if (this._cachedProfile) {
      return this._cachedProfile;
    }

    const baseProfile = this.getUserProfile();

    try {
      const graphProfile = await this._graphService.getCurrentUser();
      this._cachedProfile = { ...baseProfile, ...graphProfile };
    } catch {
      this._cachedProfile = baseProfile;
    }

    return this._cachedProfile;
  }

  public getRoleContext(): IUserRoleContext {
    if (!this._config.roles.personalizationEnabled) {
      return emptyRoleContext();
    }

    const profile = this.getUserProfile();
    return {
      userId: profile.userId,
      loginName: profile.loginName,
      roles: [],
      executiveAssistantOffices: [],
      isExecutiveAssistant: false
    };
  }
}
