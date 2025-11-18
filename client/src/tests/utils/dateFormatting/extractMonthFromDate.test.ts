import { describe, it, expect } from 'vitest';
import { extractMonthFromDate } from '@/utils/dateFormatting/extractMonthFromDate';

describe('extractMonthFromDate', () => {
  it('extracts month correctly from valid iso date (yyyy-mm-dd)', () => {
    expect(extractMonthFromDate('2020-01-15')).toBe(1);
    expect(extractMonthFromDate('2020-06-30')).toBe(6);
    expect(extractMonthFromDate('2020-12-25')).toBe(12);
  });

  it('returns null for invalid date strings', () => {
    expect(extractMonthFromDate('')).toBeNull();
    expect(extractMonthFromDate('2020')).toBeNull();
    expect(extractMonthFromDate('20-01')).toBeNull();
  });

  it('returns null for null or undefined input', () => {
    expect(extractMonthFromDate(null)).toBeNull();
    expect(extractMonthFromDate(undefined)).toBeNull();
  });

  it('returns null for month out of valid range', () => {
    expect(extractMonthFromDate('2020-00-15')).toBeNull();
    expect(extractMonthFromDate('2020-13-15')).toBeNull();
    expect(extractMonthFromDate('2020-99-15')).toBeNull();
  });

  it('handles edge case months correctly', () => {
    expect(extractMonthFromDate('2020-01-01')).toBe(1);
    expect(extractMonthFromDate('2020-12-31')).toBe(12);
  });
});
