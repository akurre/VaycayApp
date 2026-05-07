import { describe, it, expect } from 'vitest';
import { formatTempRange } from '@/utils/dataFormatting/formatTempRange';
import { TemperatureUnit } from '@/types/mapTypes';

describe('formatTempRange', () => {
  it('formats a min/max pair with the user’s temperature unit (Celsius)', () => {
    expect(formatTempRange(5, 17, TemperatureUnit.Celsius)).toBe('5.0°C–17.0°C');
  });

  it('converts to Fahrenheit when the unit is Fahrenheit', () => {
    // 0°C → 32°F, 10°C → 50°F
    expect(formatTempRange(0, 10, TemperatureUnit.Fahrenheit)).toBe(
      '32.0°F–50.0°F'
    );
  });

  it('returns the em-dash placeholder when min is missing', () => {
    expect(formatTempRange(null, 10, TemperatureUnit.Celsius)).toBe('—');
    expect(formatTempRange(undefined, 10, TemperatureUnit.Celsius)).toBe('—');
  });

  it('returns the em-dash placeholder when max is missing', () => {
    expect(formatTempRange(5, null, TemperatureUnit.Celsius)).toBe('—');
    expect(formatTempRange(5, undefined, TemperatureUnit.Celsius)).toBe('—');
  });

  it('returns the em-dash placeholder when both are missing', () => {
    expect(formatTempRange(null, null, TemperatureUnit.Celsius)).toBe('—');
  });
});
