import { describe, it, expect } from 'vitest';
import { calculateDistance } from '@/utils/location/calculateDistance';

describe('calculateDistance', () => {
  it('calculates distance between two coordinates correctly', () => {
    // new york to los angeles (approximately 3944 km)
    const distance = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
    expect(distance).toBeCloseTo(3944, -2); // within 100km
  });

  it('returns 0 for identical coordinates', () => {
    const distance = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
    expect(distance).toBe(0);
  });

  it('calculates distance for nearby cities', () => {
    // paris to london (approximately 344 km)
    const distance = calculateDistance(48.8566, 2.3522, 51.5074, -0.1278);
    expect(distance).toBeCloseTo(344, -1); // within 10km
  });

  it('handles negative coordinates', () => {
    // sydney to melbourne (approximately 714 km)
    const distance = calculateDistance(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(distance).toBeCloseTo(714, -1);
  });

  it('handles coordinates crossing the equator', () => {
    // singapore to sydney (approximately 6300 km)
    const distance = calculateDistance(1.3521, 103.8198, -33.8688, 151.2093);
    expect(distance).toBeCloseTo(6300, -2);
  });

  it('handles coordinates crossing the prime meridian', () => {
    // london to new york (approximately 5570 km)
    const distance = calculateDistance(51.5074, -0.1278, 40.7128, -74.006);
    expect(distance).toBeCloseTo(5570, -2);
  });
});
