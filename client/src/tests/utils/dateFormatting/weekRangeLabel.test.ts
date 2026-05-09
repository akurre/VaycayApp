import { describe, it, expect } from 'vitest';
import { weekRangeLabel } from '@/utils/dateFormatting/weekRangeLabel';

describe('weekRangeLabel', () => {
  it('returns Jan 1–7 for week 1', () => {
    expect(weekRangeLabel(1)).toBe('Jan 1–7');
  });

  it('returns Jan 8–14 for week 2', () => {
    expect(weekRangeLabel(2)).toBe('Jan 8–14');
  });

  it('crosses month boundaries with the long format', () => {
    // week 5: day 29 -> day 35; Jan only has 31 days, so end falls in Feb
    expect(weekRangeLabel(5)).toBe('Jan 29 – Feb 4');
  });

  it('returns mid-July for week 29', () => {
    // week 29 starts day 197 = Jul 16; ends day 203 = Jul 22
    expect(weekRangeLabel(29)).toBe('Jul 16–22');
  });

  it('clamps the end day at day 365', () => {
    // week 53 would start day 365 — start and end both Dec 31
    expect(weekRangeLabel(53)).toBe('Dec 31');
  });

  it('returns Dec 24–30 for week 52', () => {
    // startDay = 358 = Dec 24; endDay = 364 = Dec 30
    expect(weekRangeLabel(52)).toBe('Dec 24–30');
  });

  it('returns an empty string for invalid input', () => {
    expect(weekRangeLabel(0)).toBe('');
    expect(weekRangeLabel(-1)).toBe('');
    expect(weekRangeLabel(Number.NaN)).toBe('');
    expect(weekRangeLabel(Number.POSITIVE_INFINITY)).toBe('');
  });
});
