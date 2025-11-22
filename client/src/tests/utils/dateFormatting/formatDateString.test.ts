import { describe, it, expect } from 'vitest';
import { formatDateString } from '@/utils/dateFormatting/formatDateString';

describe('formatDateString', () => {
  it('formats date string correctly', () => {
    expect(formatDateString('2020-01-01')).toBe('January 1st');
    expect(formatDateString('2020-02-02')).toBe('February 2nd');
    expect(formatDateString('2020-03-03')).toBe('March 3rd');
    expect(formatDateString('2020-04-04')).toBe('April 4th');
    expect(formatDateString('2020-05-11')).toBe('May 11th');
    expect(formatDateString('2020-06-12')).toBe('June 12th');
    expect(formatDateString('2020-07-13')).toBe('July 13th');
    expect(formatDateString('2020-08-21')).toBe('August 21st');
    expect(formatDateString('2020-09-22')).toBe('September 22nd');
    expect(formatDateString('2020-10-23')).toBe('October 23rd');
    expect(formatDateString('2020-11-30')).toBe('November 30th');
    expect(formatDateString('2020-12-31')).toBe('December 31st');
  });

  it('handles invalid inputs', () => {
    expect(formatDateString(null)).toBe('');
    expect(formatDateString(undefined)).toBe('');
    expect(formatDateString('')).toBe('');
    expect(formatDateString('invalid-date')).toBe('');
    expect(formatDateString('2020/01/01')).toBe('');
  });
});
