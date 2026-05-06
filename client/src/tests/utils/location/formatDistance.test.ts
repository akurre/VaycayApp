import { describe, it, expect } from 'vitest';
import { formatDistance } from '@/utils/location/formatDistance';
import { TemperatureUnit } from '@/types/mapTypes';

describe('formatDistance', () => {
  describe('kilometer formatting (Celsius)', () => {
    it('formats short distances with 1 decimal place', () => {
      expect(formatDistance(5.3, TemperatureUnit.Celsius)).toBe('5.3 km');
      expect(formatDistance(9.9, TemperatureUnit.Celsius)).toBe('9.9 km');
      expect(formatDistance(0.5, TemperatureUnit.Celsius)).toBe('0.5 km');
    });

    it('formats medium distances without decimals', () => {
      expect(formatDistance(10, TemperatureUnit.Celsius)).toBe('10 km');
      expect(formatDistance(50, TemperatureUnit.Celsius)).toBe('50 km');
      expect(formatDistance(999, TemperatureUnit.Celsius)).toBe('999 km');
    });

    it('formats long distances with thousand separators', () => {
      expect(formatDistance(1234, TemperatureUnit.Celsius)).toBe('1,234 km');
      expect(formatDistance(10000, TemperatureUnit.Celsius)).toBe('10,000 km');
      expect(formatDistance(123456, TemperatureUnit.Celsius)).toBe(
        '123,456 km'
      );
    });

    it('handles zero distance', () => {
      expect(formatDistance(0, TemperatureUnit.Celsius)).toBe('0.0 km');
    });

    it('handles very large distances', () => {
      expect(formatDistance(20000, TemperatureUnit.Celsius)).toBe('20,000 km');
      expect(formatDistance(40075, TemperatureUnit.Celsius)).toBe('40,075 km');
    });
  });

  describe('mile formatting (Fahrenheit)', () => {
    it('converts and formats short distances with 1 decimal place', () => {
      expect(formatDistance(5, TemperatureUnit.Fahrenheit)).toBe('3.1 mi');
      expect(formatDistance(9, TemperatureUnit.Fahrenheit)).toBe('5.6 mi');
    });

    it('converts and formats medium distances without decimals', () => {
      expect(formatDistance(16, TemperatureUnit.Fahrenheit)).toBe('9.9 mi');
      expect(formatDistance(100, TemperatureUnit.Fahrenheit)).toBe('62 mi');
    });

    it('converts and formats long distances with thousand separators', () => {
      expect(formatDistance(2000, TemperatureUnit.Fahrenheit)).toBe('1,243 mi');
      expect(formatDistance(10000, TemperatureUnit.Fahrenheit)).toBe(
        '6,214 mi'
      );
    });

    it('handles zero distance', () => {
      expect(formatDistance(0, TemperatureUnit.Fahrenheit)).toBe('0.0 mi');
    });
  });

  describe('edge cases', () => {
    it('handles very small distances', () => {
      expect(formatDistance(0.1, TemperatureUnit.Celsius)).toBe('0.1 km');
      expect(formatDistance(0.01, TemperatureUnit.Celsius)).toBe('0.0 km');
    });

    it('handles decimal values correctly', () => {
      expect(formatDistance(5.567, TemperatureUnit.Celsius)).toBe('5.6 km');
      expect(formatDistance(10.567, TemperatureUnit.Celsius)).toBe('11 km');
    });
  });
});
