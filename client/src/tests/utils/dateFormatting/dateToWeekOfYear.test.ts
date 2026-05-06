import { describe, it, expect } from 'vitest';
import { dateToWeekOfYear } from '@/utils/dateFormatting/dateToWeekOfYear';

describe('dateToWeekOfYear', () => {
  it('returns 1 for Jan 1 in MM-DD format', () => {
    expect(dateToWeekOfYear('01-01')).toBe(1);
  });

  it('returns 1 for Jan 1 in YYYY-MM-DD format', () => {
    expect(dateToWeekOfYear('2026-01-01')).toBe(1);
  });

  it('returns 2 for Jan 8 (start of week 2)', () => {
    expect(dateToWeekOfYear('01-08')).toBe(2);
  });

  it('returns 29 for Jul 16 (start of week 29)', () => {
    expect(dateToWeekOfYear('07-16')).toBe(29);
  });

  it('clamps to 52 for Dec 31', () => {
    expect(dateToWeekOfYear('12-31')).toBe(52);
  });

  it('returns null for empty or invalid input', () => {
    expect(dateToWeekOfYear('')).toBeNull();
    expect(dateToWeekOfYear(null)).toBeNull();
    expect(dateToWeekOfYear(undefined)).toBeNull();
    expect(dateToWeekOfYear('not-a-date')).toBeNull();
  });
});
