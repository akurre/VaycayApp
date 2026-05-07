import { describe, it, expect } from 'vitest';
import { formatRainyDays } from '@/utils/dataFormatting/formatRainyDays';

describe('formatRainyDays', () => {
  it('uses the singular form for exactly 1 day', () => {
    expect(formatRainyDays(1)).toBe('1 rainy day');
  });

  it('uses the plural form for 0 days', () => {
    expect(formatRainyDays(0)).toBe('0 rainy days');
  });

  it('uses the plural form for multiple days', () => {
    expect(formatRainyDays(3)).toBe('3 rainy days');
    expect(formatRainyDays(7)).toBe('7 rainy days');
  });

  it('rounds non-integer counts to the nearest whole day', () => {
    expect(formatRainyDays(2.4)).toBe('2 rainy days');
    expect(formatRainyDays(2.5)).toBe('3 rainy days');
    expect(formatRainyDays(0.6)).toBe('1 rainy day');
  });

  it('returns null when the count is missing', () => {
    expect(formatRainyDays(null)).toBeNull();
    expect(formatRainyDays(undefined)).toBeNull();
  });

  it('returns null for non-finite or negative values', () => {
    expect(formatRainyDays(NaN)).toBeNull();
    expect(formatRainyDays(Infinity)).toBeNull();
    expect(formatRainyDays(-1)).toBeNull();
  });
});
