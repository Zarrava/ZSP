import { IAnnouncement } from '../../models/Announcement';
import { IDepartment } from '../../models/Department';
import { IResource } from '../../models/Resource';
import { IQuickAccessItem } from '../../models/QuickAccessItem';

export interface ISharePointDataService {
  getAnnouncements(): Promise<IAnnouncement[]>;
  getDepartments(): Promise<IDepartment[]>;
  getResources(): Promise<IResource[]>;
  getQuickAccessItems(): Promise<IQuickAccessItem[]>;
}
