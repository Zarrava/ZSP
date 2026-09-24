import { searchWorkplaceContent } from './workplaceSearchUtils';

describe('workplaceSearchUtils', () => {
  it('returns no results for short queries', () => {
    const results = searchWorkplaceContent('a', {
      announcements: [{ id: '1', title: 'Alpha', date: '2026-09-19' }],
      departments: [],
      resources: []
    });

    expect(results).toHaveLength(0);
  });

  it('searches loaded announcements, departments, and resources only', () => {
    const source = {
      announcements: [{ id: '1', title: 'Policy update', date: '2026-09-19', category: 'HR' }],
      departments: [{ id: 'dept-1', name: 'Human Resources', description: 'People and onboarding' }],
      resources: [{ id: 'res-1', title: 'Volunteer Handbook', category: 'Handbooks' }]
    };

    expect(searchWorkplaceContent('policy', source).some((item) => item.type === 'announcement')).toBe(true);
    expect(searchWorkplaceContent('human', source).some((item) => item.type === 'department')).toBe(true);
    expect(searchWorkplaceContent('handbook', source).some((item) => item.type === 'resource')).toBe(true);
  });
});
