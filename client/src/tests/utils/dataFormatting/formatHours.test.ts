import { describe, it, expect } from 'vitest';
import { formatHours } from '@/utils/dataFormatting/formatHours';

describe('formatHours', () => {
  it('defaults to one decimal of precision', () => {
    expect(formatHours(12.34)).toBe('12.3h');
  });

  it('honours an explicit decimal count', () => {
    expect(formatHours(12.34, 0)).toBe('12h');
    expect(formatHours(12.34, 2)).toBe('12.34h');
  });

  it('rounds half-up at the requested precision', () => {
    expect(formatHours(12.55, 1)).toBe('12.6h');
    expect(formatHours(12.5, 0)).toBe('13h');
  });

  it('returns the em-dash placeholder for null and undefined', () => {
    expect(formatHours(null)).toBe('—');
    expect(formatHours(undefined)).toBe('—');
  });

  it('formats zero as "0.0h" (not the placeholder)', () => {
    expect(formatHours(0)).toBe('0.0h');
    expect(formatHours(0, 0)).toBe('0h');
  });

  it('handles negative numbers without coercing them to placeholder', () => {
    expect(formatHours(-3.2)).toBe('-3.2h');
  });
});
