import { describe, it, expect } from 'vitest';
import { calculateDayLength } from '@/utils/dataFormatting/calculateDayLength';

describe('calculateDayLength', () => {
  it('should return 12 hours near the equator year-round', () => {
    const result = calculateDayLength(0, 180);
    expect(result).toBeCloseTo(12, 0);
  });

  it('should return 0 for polar night (North Pole in winter)', () => {
    // At lat=90, winter solstice (day ~355), cos hour angle > 1 → polar night
    const result = calculateDayLength(90, 355);
    expect(result).toBe(0);
  });

  it('should return 24 for polar day (North Pole in summer)', () => {
    // At lat=90, summer solstice (day ~172), cos hour angle < -1 → polar day
    const result = calculateDayLength(90, 172);
    expect(result).toBe(24);
  });

  it('should return 24 for polar day (South Pole in December)', () => {
    // At lat=-90, winter solstice in northern hemisphere = summer in southern
    const result = calculateDayLength(-90, 355);
    expect(result).toBe(24);
  });

  it('should return 0 for polar night (South Pole in June)', () => {
    const result = calculateDayLength(-90, 172);
    expect(result).toBe(0);
  });

  it('should return longer days in summer than winter at mid-latitudes', () => {
    const summerDay = calculateDayLength(50, 172);
    const winterDay = calculateDayLength(50, 355);
    expect(summerDay).toBeGreaterThan(winterDay);
  });

  it('should return a value between 0 and 24', () => {
    const testCases = [
      [45, 1], [45, 91], [45, 182], [45, 274],
      [-45, 1], [-45, 91], [-45, 182], [-45, 274],
    ] as [number, number][];

    testCases.forEach(([lat, day]) => {
      const result = calculateDayLength(lat, day);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(24);
    });
  });
});
