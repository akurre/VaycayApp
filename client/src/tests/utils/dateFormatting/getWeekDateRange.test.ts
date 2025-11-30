import { describe, it, expect } from 'vitest';
import { getWeekDateRange } from '@/utils/dateFormatting/getWeekDateRange';

describe('getWeekDateRange', () => {
  it('should return a formatted date range string', () => {
    const result = getWeekDateRange(1, 'en-US');
    // Should have a month name and at least one number
    expect(result).toMatch(/[A-Za-z]+ \d+/);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should format a week within a single month', () => {
    const result = getWeekDateRange(2, 'en-US');
    // Should contain a month and day numbers
    expect(result).toMatch(/[A-Za-z]+ \d+/);
  });

  it('should format a week that may span two months', () => {
    const result = getWeekDateRange(5, 'en-US');
    // Should contain either format: "Month DD-DD" or "Month DD - Month DD"
    expect(result).toMatch(/[A-Za-z]+ \d+/);
  });

  it('should format week 26 (mid-year)', () => {
    const result = getWeekDateRange(26, 'en-US');
    // Should be a valid date range string
    expect(result).toMatch(/[A-Za-z]+ \d+/);
  });

  it('should format week 52 (end of year)', () => {
    const result = getWeekDateRange(52, 'en-US');
    // Should be a valid date range string
    expect(result).toMatch(/[A-Za-z]+ \d+/);
  });

  it('should handle different locales', () => {
    const resultEN = getWeekDateRange(10, 'en-US');
    const resultFR = getWeekDateRange(10, 'fr-FR');
    // Both should return valid strings
    expect(resultEN).toBeTruthy();
    expect(resultFR).toBeTruthy();
    expect(typeof resultEN).toBe('string');
    expect(typeof resultFR).toBe('string');
  });

  it('should use default locale when none provided', () => {
    const result = getWeekDateRange(20);
    expect(result).toMatch(/[A-Za-z]+ \d+/);
    expect(result).toBeTruthy();
  });

  it('should handle week 1', () => {
    const result = getWeekDateRange(1, 'en-US');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(5);
  });
});
