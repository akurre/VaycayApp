import { describe, it, expect } from 'vitest';
import { extractMonthFromDate } from '@/utils/dateFormatting/extractMonthFromDate';

describe('extractMonthFromDate', () => {
  describe('valid date strings', () => {
    it('extracts month from january date', () => {
      expect(extractMonthFromDate('2024-01-15')).toBe(1);
    });

    it('extracts month from december date', () => {
      expect(extractMonthFromDate('2024-12-31')).toBe(12);
    });

    it('extracts month from middle of year', () => {
      expect(extractMonthFromDate('2024-06-15')).toBe(6);
    });

    it('handles single digit months with leading zero', () => {
      expect(extractMonthFromDate('2024-03-01')).toBe(3);
    });

    it('handles double digit months', () => {
      expect(extractMonthFromDate('2024-11-20')).toBe(11);
    });

    it('extracts month regardless of day value', () => {
      expect(extractMonthFromDate('2024-07-01')).toBe(7);
      expect(extractMonthFromDate('2024-07-31')).toBe(7);
    });

    it('extracts month regardless of year value', () => {
      expect(extractMonthFromDate('2020-05-15')).toBe(5);
      expect(extractMonthFromDate('2025-05-15')).toBe(5);
    });
  });

  describe('boundary values', () => {
    it('handles minimum valid month', () => {
      expect(extractMonthFromDate('2024-01-01')).toBe(1);
    });

    it('handles maximum valid month', () => {
      expect(extractMonthFromDate('2024-12-31')).toBe(12);
    });
  });

  describe('invalid month values', () => {
    it('returns null for month 00', () => {
      expect(extractMonthFromDate('2024-00-15')).toBeNull();
    });

    it('returns null for month 13', () => {
      expect(extractMonthFromDate('2024-13-15')).toBeNull();
    });

    it('returns null for month greater than 12', () => {
      expect(extractMonthFromDate('2024-99-15')).toBeNull();
    });
  });

  describe('null and undefined inputs', () => {
    it('returns null for null input', () => {
      expect(extractMonthFromDate(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(extractMonthFromDate(undefined)).toBeNull();
    });
  });

  describe('invalid string formats', () => {
    it('returns null for empty string', () => {
      expect(extractMonthFromDate('')).toBeNull();
    });

    it('returns null for string shorter than 7 characters', () => {
      expect(extractMonthFromDate('2024-0')).toBeNull();
    });

    it('returns null for string with exactly 6 characters', () => {
      expect(extractMonthFromDate('2024-0')).toBeNull();
    });

    it('handles malformed date strings', () => {
      expect(extractMonthFromDate('not-a-date')).toBeNull();
    });

    it('handles date string with letters in month position', () => {
      expect(extractMonthFromDate('2024-ab-15')).toBeNull();
    });
  });

  describe('edge cases with valid format but unusual values', () => {
    it('extracts month from date with extra characters after', () => {
      expect(extractMonthFromDate('2024-08-15T12:00:00')).toBe(8);
    });

    it('extracts month from date with time component', () => {
      expect(extractMonthFromDate('2024-09-20T00:00:00Z')).toBe(9);
    });

    it('handles minimum length valid string', () => {
      expect(extractMonthFromDate('2024-02')).toBe(2);
    });
  });
});
