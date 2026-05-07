import { describe, it, expect } from 'vitest';
import type { SunshineData } from '@/types/sunshineDataType';
import { hasSunshineData } from '@/utils/dataFormatting/hasSunshineData';

const allNullMonths: SunshineData = {
  cityId: 1,
  city: 'Empty',
  country: 'US',
  lat: 40.7,
  long: -74,
  population: null,
  jan: null,
  feb: null,
  mar: null,
  apr: null,
  may: null,
  jun: null,
  jul: null,
  aug: null,
  sep: null,
  oct: null,
  nov: null,
  dec: null,
};

describe('hasSunshineData', () => {
  it('returns false when data is null or undefined', () => {
    expect(hasSunshineData(null)).toBe(false);
    expect(hasSunshineData(undefined)).toBe(false);
  });

  it('returns false when every month is null', () => {
    expect(hasSunshineData(allNullMonths)).toBe(false);
  });

  it('returns true when any month has a numeric value', () => {
    expect(hasSunshineData({ ...allNullMonths, jul: 250 })).toBe(true);
    expect(hasSunshineData({ ...allNullMonths, jan: 0 })).toBe(true);
  });
});
