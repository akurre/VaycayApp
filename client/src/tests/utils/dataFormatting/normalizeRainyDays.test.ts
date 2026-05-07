import { describe, it, expect } from 'vitest';
import { normalizeRainyDays } from '@/utils/dataFormatting/normalizeRainyDays';
import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';

const baseWeek: WeekDataPoint = {
  week: 18,
  avgTemp: null,
  maxTemp: null,
  minTemp: null,
  totalPrecip: 0,
  avgPrecip: null,
  daysWithRain: 0,
  daysWithData: 7,
};

describe('normalizeRainyDays', () => {
  it('returns the count unchanged when the row already covers exactly 7 days', () => {
    expect(
      normalizeRainyDays({ ...baseWeek, daysWithRain: 3, daysWithData: 7 })
    ).toBe(3);
  });

  it('scales a multi-year aggregate down to a 7-day equivalent', () => {
    // 14 of 14 days = 7 of 7 (rains every day)
    expect(
      normalizeRainyDays({ ...baseWeek, daysWithRain: 14, daysWithData: 14 })
    ).toBe(7);
    // 7 of 14 days = 3.5 of 7
    expect(
      normalizeRainyDays({ ...baseWeek, daysWithRain: 7, daysWithData: 14 })
    ).toBe(3.5);
  });

  it('returns null when daysWithRain is missing', () => {
    expect(
      normalizeRainyDays({ ...baseWeek, daysWithRain: null })
    ).toBeNull();
  });

  it('returns null when daysWithData is zero (avoids divide-by-zero)', () => {
    expect(
      normalizeRainyDays({ ...baseWeek, daysWithRain: 3, daysWithData: 0 })
    ).toBeNull();
  });

  it('returns null when the week is missing', () => {
    expect(normalizeRainyDays(null)).toBeNull();
    expect(normalizeRainyDays(undefined)).toBeNull();
  });
});
