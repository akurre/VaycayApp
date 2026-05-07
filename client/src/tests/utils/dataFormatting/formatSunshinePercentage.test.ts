import { describe, it, expect } from 'vitest';
import { formatSunshinePercentage } from '@/utils/dataFormatting/formatSunshinePercentage';

describe('formatSunshinePercentage', () => {
  it('returns the rounded percentage with a "% sun" suffix', () => {
    // 50 / 200 = 25%
    expect(formatSunshinePercentage(50, 200)).toBe('25% sun');
  });

  it('rounds to the nearest integer (half rounds up)', () => {
    // 1.5 / 4 = 37.5% → 38
    expect(formatSunshinePercentage(1.5, 4)).toBe('38% sun');
  });

  it('returns null when actual hours is null', () => {
    expect(formatSunshinePercentage(null, 200)).toBeNull();
  });

  it('returns null when actual hours is undefined', () => {
    expect(formatSunshinePercentage(undefined, 200)).toBeNull();
  });

  it('returns null when theoretical max is null', () => {
    expect(formatSunshinePercentage(50, null)).toBeNull();
  });

  it('returns null when theoretical max is undefined', () => {
    expect(formatSunshinePercentage(50, undefined)).toBeNull();
  });

  it('returns null when theoretical max is zero (division by zero guard)', () => {
    expect(formatSunshinePercentage(0, 0)).toBeNull();
  });

  it('returns null when theoretical max is negative (defensive)', () => {
    expect(formatSunshinePercentage(50, -10)).toBeNull();
  });

  it('returns null for non-finite inputs', () => {
    expect(formatSunshinePercentage(NaN, 200)).toBeNull();
    expect(formatSunshinePercentage(50, NaN)).toBeNull();
    expect(formatSunshinePercentage(Infinity, 200)).toBeNull();
    expect(formatSunshinePercentage(50, Infinity)).toBeNull();
  });

  it('handles 0 actual hours (polar night) as 0%', () => {
    expect(formatSunshinePercentage(0, 200)).toBe('0% sun');
  });

  it('does not clamp values above 100% (data-quality signal)', () => {
    // forecast/measurement quirks can produce >100; show it as-is
    expect(formatSunshinePercentage(420, 400)).toBe('105% sun');
  });
});
