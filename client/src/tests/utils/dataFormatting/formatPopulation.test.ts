import { describe, it, expect } from 'vitest';
import { formatPopulation } from '@/utils/dataFormatting/formatPopulation';

describe('formatPopulation', () => {
  it('formats integer populations with locale separators', () => {
    expect(formatPopulation(1234567)).toMatch(/1[,.\s]234[,.\s]567/);
    expect(formatPopulation(1000)).toMatch(/1[,.\s]000/);
  });

  it('formats small populations without separators', () => {
    expect(formatPopulation(0)).toBe('0');
    expect(formatPopulation(7)).toBe('7');
    expect(formatPopulation(999)).toBe('999');
  });

  it('returns the em-dash placeholder for null and undefined', () => {
    expect(formatPopulation(null)).toBe('—');
    expect(formatPopulation(undefined)).toBe('—');
  });
});
