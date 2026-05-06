import { describe, it, expect } from 'vitest';
import formatDateForLabel from '@/utils/dateFormatting/formatDateForLabel';

describe('formatDateForLabel', () => {
  describe('daily mode (isMonthly=false)', () => {
    it('formats MMDD strings into "MMM. D" labels', () => {
      expect(formatDateForLabel('0101', false)).toBe('Jan. 1');
      expect(formatDateForLabel('0410', false)).toBe('Apr. 10');
      expect(formatDateForLabel('1231', false)).toBe('Dec. 31');
    });

    it('drops the period for May per the abbreviations table', () => {
      expect(formatDateForLabel('0501', false)).toBe('May 1');
    });
  });

  describe('monthly mode (isMonthly=true)', () => {
    it('reads the leading two-digit month and returns the short label', () => {
      expect(formatDateForLabel('01-15', true)).toBe('Jan');
      expect(formatDateForLabel('07-15', true)).toBe('Jul');
      expect(formatDateForLabel('12-15', true)).toBe('Dec');
    });

    it('returns empty string when the month substring is not in monthlyMarks', () => {
      expect(formatDateForLabel('00-15', true)).toBe('');
      expect(formatDateForLabel('99-15', true)).toBe('');
    });
  });
});
