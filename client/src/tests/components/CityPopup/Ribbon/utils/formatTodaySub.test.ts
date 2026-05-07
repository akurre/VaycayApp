import { describe, it, expect } from 'vitest';
import { formatTodaySub } from '@/components/CityPopup/Ribbon/utils/formatTodaySub';
import { DataType } from '@/types/mapTypes';

describe('formatTodaySub', () => {
  it('returns a "X rainy days" sub-line for the precip tab', () => {
    expect(formatTodaySub(DataType.Precip, 3)).toBe('3 rainy days');
    expect(formatTodaySub(DataType.Precip, 1)).toBe('1 rainy day');
  });

  it('returns null for the temperature tab even when given a value', () => {
    expect(formatTodaySub(DataType.Temperature, 5)).toBeNull();
  });

  it('returns null for the sunshine tab even when given a value', () => {
    expect(formatTodaySub(DataType.Sunshine, 5)).toBeNull();
  });

  it('returns null when the value is null on the precip tab', () => {
    expect(formatTodaySub(DataType.Precip, null)).toBeNull();
  });
});
