import { describe, it, expect } from 'vitest';
import { formatMm } from '@/utils/dataFormatting/formatMm';

describe('formatMm', () => {
  it('rounds to the nearest integer millimeter', () => {
    expect(formatMm(42)).toBe('42mm');
    expect(formatMm(42.4)).toBe('42mm');
    expect(formatMm(42.5)).toBe('43mm');
    expect(formatMm(42.9)).toBe('43mm');
  });

  it('returns the em-dash placeholder for null and undefined', () => {
    expect(formatMm(null)).toBe('—');
    expect(formatMm(undefined)).toBe('—');
  });

  it('formats zero as "0mm" (not the placeholder)', () => {
    expect(formatMm(0)).toBe('0mm');
  });

  it('handles negative numbers without coercing them to placeholder', () => {
    expect(formatMm(-1.4)).toBe('-1mm');
  });
});
