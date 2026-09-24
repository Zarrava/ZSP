import {
  getAllWorldClockDisplays,
  getWorldClockDisplay,
  ZEF_WORLD_CLOCK_CITIES
} from './worldClockUtils';

describe('worldClockUtils', () => {
  it('defines four ZEF office locations', () => {
    expect(ZEF_WORLD_CLOCK_CITIES).toHaveLength(4);
    expect(ZEF_WORLD_CLOCK_CITIES.map((city) => city.label)).toEqual([
      'Lagos',
      'London',
      'Nairobi',
      'Mumbai'
    ]);
  });

  it('formats live clock display for a known timezone', () => {
    const lagos = ZEF_WORLD_CLOCK_CITIES[0];
    const display = getWorldClockDisplay(lagos, new Date('2026-06-15T12:00:00Z'));

    expect(display.label).toBe('Lagos');
    expect(display.time).toMatch(/^\d{2}:\d{2}$/);
    expect(display.period).toMatch(/AM|PM/);
  });

  it('returns all office clocks', () => {
    const displays = getAllWorldClockDisplays(new Date('2026-06-15T12:00:00Z'));
    expect(displays).toHaveLength(4);
  });
});
