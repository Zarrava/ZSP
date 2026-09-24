/**
 * SharePoint internal field names for ZEF Announcements.
 * Override via configuration list / web part properties in a future phase.
 */
export interface IAnnouncementsFieldMapping {
  title: string;
  body: string;
  category: string;
  publishedDate: string;
  link: string;
  expiryDate: string;
  priority: string;
}

/** SharePoint internal field names for ZEF Departments. */
export interface IDepartmentsFieldMapping {
  title: string;
  description: string;
  sharePointSiteUrl: string;
  teamsUrl: string;
  icon: string;
  sortOrder: string;
}

/** SharePoint internal field names for ZEF Resources. */
export interface IResourcesFieldMapping {
  title: string;
  description: string;
  link: string;
  icon: string;
  resourceCategory: string;
  audience: string;
}

export interface ISharePointListConfig<TFieldMapping> {
  /** SharePoint list display title */
  listTitle: string;
  /** Internal field name mappings */
  fields: TFieldMapping;
}

export interface ISharePointListsConfig {
  announcements: ISharePointListConfig<IAnnouncementsFieldMapping>;
  departments: ISharePointListConfig<IDepartmentsFieldMapping>;
  resources: ISharePointListConfig<IResourcesFieldMapping>;
}
