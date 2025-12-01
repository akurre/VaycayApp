import { describe, it, expect } from 'vitest';
import {
  convertTemperature,
  getTemperatureUnitSymbol,
} from '@/utils/tempFormatting/convertTemperature';
import { TemperatureUnit } from '@/types/mapTypes';

describe('convertTemperature', () => {
  describe('celsius to fahrenheit conversion', () => {
    it('converts positive celsius to fahrenheit correctly', () => {
      expect(convertTemperature(25, TemperatureUnit.Fahrenheit)).toBe(77);
    });

    it('converts zero celsius to fahrenheit correctly', () => {
      expect(convertTemperature(0, TemperatureUnit.Fahrenheit)).toBe(32);
    });

    it('converts negative celsius to fahrenheit correctly', () => {
      expect(convertTemperature(-10, TemperatureUnit.Fahrenheit)).toBe(14);
    });

    it('converts freezing point correctly', () => {
      expect(convertTemperature(0, TemperatureUnit.Fahrenheit)).toBe(32);
    });

    it('converts boiling point correctly', () => {
      expect(convertTemperature(100, TemperatureUnit.Fahrenheit)).toBe(212);
    });

    it('handles decimal values correctly', () => {
      expect(convertTemperature(25.5, TemperatureUnit.Fahrenheit)).toBe(77.9);
    });

    it('handles very cold temperatures', () => {
      expect(convertTemperature(-40, TemperatureUnit.Fahrenheit)).toBe(-40);
    });

    it('handles very hot temperatures', () => {
      expect(convertTemperature(50, TemperatureUnit.Fahrenheit)).toBe(122);
    });
  });

  describe('celsius to celsius conversion', () => {
    it('returns same value when unit is celsius', () => {
      expect(convertTemperature(25, TemperatureUnit.Celsius)).toBe(25);
    });

    it('returns zero when input is zero', () => {
      expect(convertTemperature(0, TemperatureUnit.Celsius)).toBe(0);
    });

    it('returns negative value unchanged', () => {
      expect(convertTemperature(-10, TemperatureUnit.Celsius)).toBe(-10);
    });

    it('handles decimal values', () => {
      expect(convertTemperature(25.5, TemperatureUnit.Celsius)).toBe(25.5);
    });
  });

  describe('edge cases', () => {
    it('handles absolute zero in celsius', () => {
      expect(
        convertTemperature(-273.15, TemperatureUnit.Fahrenheit)
      ).toBeCloseTo(-459.67, 1);
    });

    it('handles very small decimal values', () => {
      expect(convertTemperature(0.1, TemperatureUnit.Fahrenheit)).toBe(32.18);
    });

    it('handles large positive values', () => {
      expect(convertTemperature(1000, TemperatureUnit.Fahrenheit)).toBe(1832);
    });

    it('handles large negative values', () => {
      expect(convertTemperature(-1000, TemperatureUnit.Fahrenheit)).toBe(-1768);
    });
  });
});

describe('getTemperatureUnitSymbol', () => {
  it('returns °C for celsius unit', () => {
    expect(getTemperatureUnitSymbol(TemperatureUnit.Celsius)).toBe('°C');
  });

  it('returns °F for fahrenheit unit', () => {
    expect(getTemperatureUnitSymbol(TemperatureUnit.Fahrenheit)).toBe('°F');
  });
});
