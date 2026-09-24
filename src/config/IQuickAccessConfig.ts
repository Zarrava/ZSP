export interface IQuickAccessDestination {
  id: string;
  title: string;
  description: string;
  iconName: string;
  /**
   * Destination URL. Empty string means derive at runtime
   * (e.g. OneDrive via Graph, or site-relative document library).
   */
  url: string;
}

export interface IQuickAccessConfig {
  destinations: IQuickAccessDestination[];
  /** Fallback document library segment when Graph OneDrive URL is unavailable. */
  sharedDocumentsLibraryName: string;
}
