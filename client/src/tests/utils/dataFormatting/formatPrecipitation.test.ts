import { describe, it, expect } from 'vitest';
import { formatPrecipitation } from '@/utils/dataFormatting/formatPrecipitation';
import { TemperatureUnit } from '@/types/mapTypes';

describe('formatPrecipitation', () => {
  describe('Celsius (metric)', () => {
    it('rounds to the nearest integer millimeter', () => {
      expect(formatPrecipitation(42, TemperatureUnit.Celsius)).toBe('42mm');
      expect(formatPrecipitation(42.4, TemperatureUnit.Celsius)).toBe('42mm');
      expect(formatPrecipitation(42.5, TemperatureUnit.Celsius)).toBe('43mm');
    });

    it('formats zero as "0mm"', () => {
      expect(formatPrecipitation(0, TemperatureUnit.Celsius)).toBe('0mm');
    });
  });

  describe('Fahrenheit (imperial)', () => {
    it('converts mm to inches with one decimal place', () => {
      expect(formatPrecipitation(25.4, TemperatureUnit.Fahrenheit)).toBe(
        '1.0in'
      );
      expect(formatPrecipitation(50.8, TemperatureUnit.Fahrenheit)).toBe(
        '2.0in'
      );
      expect(formatPrecipitation(12.7, TemperatureUnit.Fahrenheit)).toBe(
        '0.5in'
      );
    });

    it('formats zero as "0.0in"', () => {
      expect(formatPrecipitation(0, TemperatureUnit.Fahrenheit)).toBe('0.0in');
    });
  });

  describe('null / undefined', () => {
    it('returns the em-dash placeholder', () => {
      expect(formatPrecipitation(null, TemperatureUnit.Celsius)).toBe('—');
      expect(formatPrecipitation(undefined, TemperatureUnit.Celsius)).toBe('—');
      expect(formatPrecipitation(null, TemperatureUnit.Fahrenheit)).toBe('—');
    });
  });
});
