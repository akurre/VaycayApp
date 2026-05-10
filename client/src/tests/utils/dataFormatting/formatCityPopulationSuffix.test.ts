import { describe, it, expect } from 'vitest';
import { formatCityPopulationSuffix } from '@/utils/dataFormatting/formatCityPopulationSuffix';

describe('formatCityPopulationSuffix', () => {
  it('returns empty string when population is null', () => {
    expect(formatCityPopulationSuffix(null)).toBe('');
  });

  it('returns empty string when population is undefined', () => {
    expect(formatCityPopulationSuffix(undefined)).toBe('');
  });

  it('returns empty string when population is zero', () => {
    expect(formatCityPopulationSuffix(0)).toBe('');
  });

  it('formats millions with one decimal and a leading bullet', () => {
    expect(formatCityPopulationSuffix(13_960_000)).toBe(' • 14.0M');
  });

  it('formats sub-million populations as fractional millions', () => {
    expect(formatCityPopulationSuffix(545_000)).toBe(' • 0.5M');
  });
});
