import { describe, it, expect } from 'vitest';
import { formatDistanceFromHome } from '@/utils/location/formatDistanceFromHome';
import { TemperatureUnit } from '@/types/mapTypes';

describe('formatDistanceFromHome', () => {
  it('returns a formatted km distance when all coords are provided (Celsius)', () => {
    // NYC ~ (40.7128, -74.006), LA ~ (34.0522, -118.2437) — roughly 3,940 km
    const result = formatDistanceFromHome(
      40.7128,
      -74.006,
      34.0522,
      -118.2437,
      TemperatureUnit.Celsius
    );
    expect(result).toMatch(/km$/);
    expect(result).toMatch(/3,9\d{2}/);
  });

  it('returns a formatted miles distance when the unit is Fahrenheit', () => {
    const result = formatDistanceFromHome(
      40.7128,
      -74.006,
      34.0522,
      -118.2437,
      TemperatureUnit.Fahrenheit
    );
    expect(result).toMatch(/mi$/);
  });

  it('returns the em-dash placeholder when the home lat is missing', () => {
    expect(
      formatDistanceFromHome(null, -74, 34, -118, TemperatureUnit.Celsius)
    ).toBe('—');
  });

  it('returns the em-dash placeholder when the home long is missing', () => {
    expect(
      formatDistanceFromHome(40, null, 34, -118, TemperatureUnit.Celsius)
    ).toBe('—');
  });

  it('returns the em-dash placeholder when the destination lat is missing', () => {
    expect(
      formatDistanceFromHome(40, -74, null, -118, TemperatureUnit.Celsius)
    ).toBe('—');
  });

  it('returns the em-dash placeholder when the destination long is missing', () => {
    expect(
      formatDistanceFromHome(40, -74, 34, null, TemperatureUnit.Celsius)
    ).toBe('—');
  });
});
