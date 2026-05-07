import { describe, it, expect } from 'vitest';
import type { SunshineData } from '@/types/sunshineDataType';
import { getMonthlySunshineHours } from '@/utils/dataFormatting/getMonthlySunshineHours';

const baseData: SunshineData = {
  cityId: 1,
  city: 'Test',
  country: 'US',
  lat: 40.7,
  long: -74,
  population: null,
  jan: 100,
  feb: null,
  mar: 150,
  apr: null,
  may: 200,
  jun: null,
  jul: null,
  aug: null,
  sep: null,
  oct: null,
  nov: null,
  dec: 80,
};

describe('getMonthlySunshineHours', () => {
  it('returns the value for the requested 1-based month', () => {
    expect(getMonthlySunshineHours(baseData, 1)).toBe(100);
    expect(getMonthlySunshineHours(baseData, 5)).toBe(200);
    expect(getMonthlySunshineHours(baseData, 12)).toBe(80);
  });

  it('returns null when the month value is null', () => {
    expect(getMonthlySunshineHours(baseData, 2)).toBeNull();
    expect(getMonthlySunshineHours(baseData, 7)).toBeNull();
  });

  it('returns null when the data is missing', () => {
    expect(getMonthlySunshineHours(null, 5)).toBeNull();
    expect(getMonthlySunshineHours(undefined, 5)).toBeNull();
  });

  it('returns null for out-of-range months', () => {
    expect(getMonthlySunshineHours(baseData, 0)).toBeNull();
    expect(getMonthlySunshineHours(baseData, 13)).toBeNull();
    expect(getMonthlySunshineHours(baseData, -1)).toBeNull();
  });

  it('returns null for non-integer months', () => {
    expect(getMonthlySunshineHours(baseData, 1.5)).toBeNull();
    expect(getMonthlySunshineHours(baseData, NaN)).toBeNull();
  });
});
