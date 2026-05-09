import { describe, it, expect } from 'vitest';
import { extractMonthDay } from '@/utils/dateFormatting/extractMonthDay';

describe('extractMonthDay', () => {
  it('should extract MM-DD from YYYY-MM-DD format', () => {
    expect(extractMonthDay('2020-11-26')).toBe('11-26');
    expect(extractMonthDay('2026-01-01')).toBe('01-01');
    expect(extractMonthDay('1999-12-31')).toBe('12-31');
  });

  it('should return the input unchanged for MM-DD format', () => {
    expect(extractMonthDay('11-26')).toBe('11-26');
    expect(extractMonthDay('01-01')).toBe('01-01');
    expect(extractMonthDay('07-04')).toBe('07-04');
  });

  it('should return empty string for empty input', () => {
    expect(extractMonthDay('')).toBe('');
  });
});
