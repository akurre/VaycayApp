import { describe, it, expect } from 'vitest';
import { weekStartLabel } from '@/utils/dateFormatting/weekStartLabel';

describe('weekStartLabel', () => {
  it('returns Jan 1 for week 1', () => {
    expect(weekStartLabel(1)).toBe('Jan 1');
  });

  it('returns Jan 8 for week 2', () => {
    expect(weekStartLabel(2)).toBe('Jan 8');
  });

  it('returns the start of February near the end of week 5', () => {
    // week 5 starts on day-of-year 29, still January
    expect(weekStartLabel(5)).toBe('Jan 29');
    // week 6 starts on day 36 -> Feb 5 (non-leap)
    expect(weekStartLabel(6)).toBe('Feb 5');
  });

  it('returns mid-July for week 29', () => {
    // week 29 starts on day-of-year 197 = Jul 16 (non-leap)
    expect(weekStartLabel(29)).toBe('Jul 16');
  });

  it('returns Dec 24 for week 52', () => {
    // week 52 starts on day-of-year 358 = Dec 24 (non-leap)
    expect(weekStartLabel(52)).toBe('Dec 24');
  });

  it('clamps to Dec 31 for overflow weeks', () => {
    expect(weekStartLabel(53)).toBe('Dec 31');
  });

  it('returns an empty string for invalid input', () => {
    expect(weekStartLabel(0)).toBe('');
    expect(weekStartLabel(-1)).toBe('');
    expect(weekStartLabel(Number.NaN)).toBe('');
  });
});
