import { describe, it, expect } from 'vitest';
import type { SunshineData } from '@/types/sunshineDataType';
import { getSunshinePercent } from '@/utils/dataFormatting/getSunshinePercent';
import { calculateTheoreticalMaxSunshine } from '@/utils/dataFormatting/calculateTheoreticalMaxSunshine';

const baseData: SunshineData = {
  cityId: 1,
  city: 'Test',
  country: 'US',
  lat: 40.7,
  long: -74,
  population: null,
  jan: null,
  feb: null,
  mar: null,
  apr: null,
  may: 200,
  jun: null,
  jul: null,
  aug: null,
  sep: null,
  oct: null,
  nov: null,
  dec: null,
};

describe('getSunshinePercent', () => {
  it('returns the actual/theoretical-max ratio as a 0-100 percent', () => {
    const lat = 40.7;
    const month = 5;
    const max = calculateTheoreticalMaxSunshine(lat, month);
    const expected = (200 / max) * 100;
    expect(getSunshinePercent(baseData, month, lat)).toBeCloseTo(expected, 5);
  });

  it('returns 0 when the actual hours are 0 (polar night-style data)', () => {
    expect(getSunshinePercent({ ...baseData, may: 0 }, 5, 40.7)).toBe(0);
  });

  it('returns null when the city data is missing', () => {
    expect(getSunshinePercent(null, 5, 40.7)).toBeNull();
    expect(getSunshinePercent(undefined, 5, 40.7)).toBeNull();
  });

  it('returns null when the requested month has no data', () => {
    expect(getSunshinePercent(baseData, 1, 40.7)).toBeNull();
  });

  it('returns null when the latitude is missing or non-finite', () => {
    expect(getSunshinePercent(baseData, 5, null)).toBeNull();
    expect(getSunshinePercent(baseData, 5, undefined)).toBeNull();
    expect(getSunshinePercent(baseData, 5, NaN)).toBeNull();
  });

  it('returns null for out-of-range months', () => {
    expect(getSunshinePercent(baseData, 0, 40.7)).toBeNull();
    expect(getSunshinePercent(baseData, 13, 40.7)).toBeNull();
  });
});
