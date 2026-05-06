import { describe, it, expect } from 'vitest';
import { getClimateZoneFromLat } from '@/utils/climate/getClimateZoneFromLat';

describe('getClimateZoneFromLat', () => {
  it('returns 0° on the equator with no hemisphere suffix', () => {
    expect(getClimateZoneFromLat(0)).toBe('0°');
  });

  it('appends N for positive (northern) latitudes', () => {
    expect(getClimateZoneFromLat(52)).toBe('52°N');
    expect(getClimateZoneFromLat(40.7)).toBe('41°N');
  });

  it('appends S for negative (southern) latitudes', () => {
    expect(getClimateZoneFromLat(-33)).toBe('33°S');
    expect(getClimateZoneFromLat(-12.4)).toBe('12°S');
  });

  it('rounds the magnitude to the nearest integer', () => {
    expect(getClimateZoneFromLat(52.49)).toBe('52°N');
    expect(getClimateZoneFromLat(52.5)).toBe('53°N');
    expect(getClimateZoneFromLat(-23.5)).toBe('24°S');
  });

  it('handles the poles', () => {
    expect(getClimateZoneFromLat(90)).toBe('90°N');
    expect(getClimateZoneFromLat(-90)).toBe('90°S');
  });
});
