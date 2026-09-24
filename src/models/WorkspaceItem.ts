export interface IWorkspaceItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  iconName?: string;
}

export interface IWorkspaceSection {
  id: string;
  title: string;
  items: IWorkspaceItem[];
}
