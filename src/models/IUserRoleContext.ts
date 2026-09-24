export type ZefWorkplaceRole =
  | 'generalMember'
  | 'teamLead'
  | 'techLead'
  | 'coo'
  | 'leadCoordinator'
  | 'administration'
  | 'hr'
  | 'executiveAssistant'
  | 'leadership';

export interface IUserRoleContext {
  userId?: string;
  loginName?: string;
  /** Resolved workplace roles — populated when tenant role mapping is configured. */
  roles: ZefWorkplaceRole[];
  /** Offices an EA supports — future phase; empty until configured. */
  executiveAssistantOffices: string[];
  isExecutiveAssistant: boolean;
}

export const emptyRoleContext = (): IUserRoleContext => ({
  roles: [],
  executiveAssistantOffices: [],
  isExecutiveAssistant: false
});
