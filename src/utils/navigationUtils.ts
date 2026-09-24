/**
 * Builds a SharePoint modern/all-items view URL for a list on the current web.
 * Uses the host web URL from SPFx context — no invented tenant paths.
 */
export const buildSharePointListAllItemsUrl = (
  webAbsoluteUrl: string,
  listTitle: string
): string => {
  const baseUrl = webAbsoluteUrl.replace(/\/$/, '');
  return `${baseUrl}/Lists/${encodeURIComponent(listTitle)}/AllItems.aspx`;
};

export const buildSharePointLibraryUrl = (
  webAbsoluteUrl: string,
  libraryName: string
): string => {
  const baseUrl = webAbsoluteUrl.replace(/\/$/, '');
  return `${baseUrl}/${encodeURI(libraryName)}`;
};
