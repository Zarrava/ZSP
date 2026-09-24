import { enrichDepartment, getDepartmentIconName } from './departmentCatalog';

describe('departmentCatalog', () => {
  it('uses catalog icon when SharePoint icon is missing', () => {
    expect(getDepartmentIconName('Human Resources')).toBe('People');
  });

  it('preserves SharePoint icon when provided', () => {
    expect(getDepartmentIconName('Human Resources', 'CustomIcon')).toBe('CustomIcon');
  });

  it('fills description when SharePoint description is empty', () => {
    const enriched = enrichDepartment({
      id: 'dept-1',
      name: 'Design',
      description: ''
    });

    expect(enriched.iconName).toBe('Design');
    expect(enriched.description).toContain('Brand assets');
  });

  it('uses outreach and community icons from the catalog', () => {
    expect(getDepartmentIconName('Programs & Outreach')).toBe('Globe');
    expect(getDepartmentIconName('Community Managers')).toBe('PeopleCommunity');
  });
});
