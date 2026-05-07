import { describe, it, expect } from 'vitest';
import { formatTodayHeadline } from '@/components/CityPopup/Ribbon/utils/formatTodayHeadline';
import { DataType, TemperatureUnit } from '@/types/mapTypes';

describe('formatTodayHeadline', () => {
  it('formats temperature using the user’s unit (Celsius)', () => {
    expect(
      formatTodayHeadline(DataType.Temperature, 12.9, TemperatureUnit.Celsius)
    ).toBe('12.9°C');
  });

  it('formats temperature in Fahrenheit when requested', () => {
    expect(
      formatTodayHeadline(DataType.Temperature, 0, TemperatureUnit.Fahrenheit)
    ).toBe('32.0°F');
  });

  it('rounds sunshine values to a whole-number percent', () => {
    expect(
      formatTodayHeadline(DataType.Sunshine, 42.7, TemperatureUnit.Celsius)
    ).toBe('43% sun');
  });

  it('rounds precip to the nearest mm', () => {
    expect(
      formatTodayHeadline(DataType.Precip, 40.4, TemperatureUnit.Celsius)
    ).toBe('40mm');
  });

  it('returns the em-dash placeholder when the value is null (any tab)', () => {
    expect(
      formatTodayHeadline(DataType.Temperature, null, TemperatureUnit.Celsius)
    ).toBe('—');
    expect(
      formatTodayHeadline(DataType.Sunshine, null, TemperatureUnit.Celsius)
    ).toBe('—');
    expect(
      formatTodayHeadline(DataType.Precip, null, TemperatureUnit.Celsius)
    ).toBe('—');
  });
});
