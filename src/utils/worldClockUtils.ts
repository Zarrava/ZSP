export interface IWorldClockCity {
  id: string;
  label: string;
  timeZone: string;
}

/** ZEF global office locations — times are computed live via Intl API. */
export const ZEF_WORLD_CLOCK_CITIES: IWorldClockCity[] = [
  { id: 'lagos', label: 'Lagos', timeZone: 'Africa/Lagos' },
  { id: 'london', label: 'London', timeZone: 'Europe/London' },
  { id: 'nairobi', label: 'Nairobi', timeZone: 'Africa/Nairobi' },
  { id: 'mumbai', label: 'Mumbai', timeZone: 'Asia/Kolkata' }
];

export interface IWorldClockDisplay {
  id: string;
  label: string;
  time: string;
  period: string;
  offsetLabel: string;
}

const formatOffsetLabel = (timeZone: string, referenceDate: Date): string => {
  try {
    const formatted = referenceDate.toLocaleTimeString('en-US', {
      timeZone,
      timeZoneName: 'short'
    });
    const match = /GMT[+-]\d{1,2}(?::\d{2})?|UTC[+-]\d{1,2}(?::\d{2})?/.exec(formatted);
    return match ? match[0] : '';
  }
  catch {
    return '';
  }
};

const parseTimeParts = (formatted: string): { time: string; period: string } => {
  const match = /^(\d{1,2}:\d{2})\s*(AM|PM)?/i.exec(formatted.trim());
  if (!match) {
    return { time: formatted.trim(), period: '' };
  }

  return {
    time: match[1],
    period: match[2] ? match[2].toUpperCase() : ''
  };
};

export const getWorldClockDisplay = (
  city: IWorldClockCity,
  referenceDate: Date = new Date()
): IWorldClockDisplay => {
  const formatted = referenceDate.toLocaleTimeString('en-GB', {
    timeZone: city.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const { time, period } = parseTimeParts(formatted);

  return {
    id: city.id,
    label: city.label,
    time,
    period,
    offsetLabel: formatOffsetLabel(city.timeZone, referenceDate)
  };
};

export const getAllWorldClockDisplays = (
  referenceDate: Date = new Date()
): IWorldClockDisplay[] =>
  ZEF_WORLD_CLOCK_CITIES.map((city) => getWorldClockDisplay(city, referenceDate));
