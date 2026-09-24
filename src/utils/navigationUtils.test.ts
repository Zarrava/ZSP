import {
  buildSharePointLibraryUrl,
  buildSharePointListAllItemsUrl
} from './navigationUtils';

describe('navigationUtils', () => {
  it('builds a SharePoint list all-items URL from the current web', () => {
    const url = buildSharePointListAllItemsUrl(
      'https://zurfteempowercare.sharepoint.com/sites/ZEF',
      'ZEF Announcements'
    );

    expect(url).toBe(
      'https://zurfteempowercare.sharepoint.com/sites/ZEF/Lists/ZEF%20Announcements/AllItems.aspx'
    );
  });

  it('builds a SharePoint library URL from the current web', () => {
    const url = buildSharePointLibraryUrl(
      'https://zurfteempowercare.sharepoint.com/sites/ZEF/',
      'Shared Documents'
    );

    expect(url).toBe(
      'https://zurfteempowercare.sharepoint.com/sites/ZEF/Shared%20Documents'
    );
  });
});
