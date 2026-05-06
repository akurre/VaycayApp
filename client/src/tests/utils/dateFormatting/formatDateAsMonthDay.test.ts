import { describe, it, expect } from 'vitest';
import { formatDateAsMonthDay } from '@/utils/dateFormatting/formatDateAsMonthDay';

describe('formatDateAsMonthDay', () => {
  it('formats date string as "Month Day" without ordinal suffix', () => {
    expect(formatDateAsMonthDay('2020-01-01')).toBe('January 1');
    expect(formatDateAsMonthDay('2020-04-23')).toBe('April 23');
    expect(formatDateAsMonthDay('2020-07-04')).toBe('July 4');
    expect(formatDateAsMonthDay('2020-12-31')).toBe('December 31');
  });

  it('strips leading zero from day-of-month', () => {
    expect(formatDateAsMonthDay('2026-05-06')).toBe('May 6');
    expect(formatDateAsMonthDay('2026-05-09')).toBe('May 9');
  });

  it('accepts MM-DD format (no year)', () => {
    expect(formatDateAsMonthDay('03-22')).toBe('March 22');
    expect(formatDateAsMonthDay('07-04')).toBe('July 4');
    expect(formatDateAsMonthDay('12-31')).toBe('December 31');
  });

  it('accepts MMDD format (no separator, e.g. from getTodayAsMMDD)', () => {
    expect(formatDateAsMonthDay('0322')).toBe('March 22');
    expect(formatDateAsMonthDay('0704')).toBe('July 4');
    expect(formatDateAsMonthDay('1231')).toBe('December 31');
  });

  it('handles invalid inputs', () => {
    expect(formatDateAsMonthDay(null)).toBe('');
    expect(formatDateAsMonthDay(undefined)).toBe('');
    expect(formatDateAsMonthDay('')).toBe('');
    expect(formatDateAsMonthDay('invalid-date')).toBe('');
    expect(formatDateAsMonthDay('2020/01/01')).toBe('');
    expect(formatDateAsMonthDay('13-01')).toBe('');
    expect(formatDateAsMonthDay('00-15')).toBe('');
    expect(formatDateAsMonthDay('1301')).toBe('');
    expect(formatDateAsMonthDay('0500')).toBe('');
  });
});
