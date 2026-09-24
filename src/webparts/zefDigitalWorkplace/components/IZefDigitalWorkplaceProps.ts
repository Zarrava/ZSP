import { IWorkplaceServices } from '../../../services/IWorkplaceServices';

export interface IZefDigitalWorkplaceProps {
  services: IWorkplaceServices;
  /** Missing, empty, and invalid values are treated as Auto. */
  experienceMode?: string;
  /** SharePoint page pathname. Query strings and hashes are not included. */
  pagePath?: string;
}
