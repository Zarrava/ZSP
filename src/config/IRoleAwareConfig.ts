import { ZefWorkplaceRole } from '../models/IUserRoleContext';

/**
 * Foundation for future role-aware personalization.
 * No tenant-specific identities or hard-coded user mappings belong here.
 */
export interface IExecutiveAssistantConfig {
  /** Department list title value identifying the EA workspace. */
  departmentTitle: string;
  /** Office identifiers supported for future EA-to-office assignments. */
  supportedOffices: readonly string[];
}

export interface IRoleAwareConfig {
  /** When false, all users receive the same experience (current production behaviour). */
  personalizationEnabled: boolean;
  executiveAssistant: IExecutiveAssistantConfig;
  /** Future: map Azure AD / SharePoint group names to workplace roles. */
  roleGroupMappings: Partial<Record<ZefWorkplaceRole, readonly string[]>>;
}
