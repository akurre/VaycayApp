import { describe, it, expect } from 'vitest';
import { normalizeWeekPrecip } from '@/utils/dataFormatting/normalizeWeekPrecip';
import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';

const baseWeek: WeekDataPoint = {
  week: 18,
  avgTemp: null,
  maxTemp: null,
  minTemp: null,
  totalPrecip: 0,
  avgPrecip: null,
  daysWithRain: null,
  daysWithData: 7,
};

describe('normalizeWeekPrecip', () => {
  it('returns the total unchanged when the row already covers exactly 7 days', () => {
    expect(
      normalizeWeekPrecip({ ...baseWeek, totalPrecip: 14, daysWithData: 7 })
    ).toBe(14);
  });

  it('scales a multi-year aggregate down to a 7-day equivalent', () => {
    // 28mm over 14 days = 14mm per typical week
    expect(
      normalizeWeekPrecip({ ...baseWeek, totalPrecip: 28, daysWithData: 14 })
    ).toBe(14);
    // 6mm over 3 days = 14mm per typical week
    expect(
      normalizeWeekPrecip({ ...baseWeek, totalPrecip: 6, daysWithData: 3 })
    ).toBe(14);
  });

  it('returns null when totalPrecip is missing', () => {
    expect(
      normalizeWeekPrecip({ ...baseWeek, totalPrecip: null })
    ).toBeNull();
  });

  it('returns null when daysWithData is zero (avoids divide-by-zero)', () => {
    expect(
      normalizeWeekPrecip({ ...baseWeek, totalPrecip: 14, daysWithData: 0 })
    ).toBeNull();
  });

  it('returns null when the week is missing', () => {
    expect(normalizeWeekPrecip(null)).toBeNull();
    expect(normalizeWeekPrecip(undefined)).toBeNull();
  });

  it('passes a true zero through (vs treating it like missing data)', () => {
    expect(
      normalizeWeekPrecip({ ...baseWeek, totalPrecip: 0, daysWithData: 7 })
    ).toBe(0);
  });
});
