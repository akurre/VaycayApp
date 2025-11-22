import { describe, it, expect, beforeEach } from 'vitest';
import { calculateDistanceFromHome } from '@/utils/location/calculateDistanceFromHome';
import { useAppStore } from '@/stores/useAppStore';
import type { HomeLocation } from '@/types/userLocationType';

describe('calculateDistanceFromHome', () => {
  beforeEach(() => {
    // reset store state before each test
    useAppStore.setState({ homeLocation: null });
  });

  it('returns null when home location is not set', () => {
    const distance = calculateDistanceFromHome(40.7128, -74.006);
    expect(distance).toBeNull();
  });

  it('calculates distance correctly when home location is set', () => {
    // set home location to new york
    const homeLocation: HomeLocation = {
      cityId: 1,
      cityName: 'New York',
      country: 'United States',
      state: 'New York',
      coordinates: { lat: 40.7128, long: -74.006 },
      source: 'manual',
    };
    useAppStore.setState({ homeLocation });

    // calculate distance to los angeles (approximately 3944 km)
    const distance = calculateDistanceFromHome(34.0522, -118.2437);
    expect(distance).toBeCloseTo(3944, -2); // within 100km
  });

  it('returns 0 for identical coordinates', () => {
    const homeLocation: HomeLocation = {
      cityId: 1,
      cityName: 'Paris',
      country: 'France',
      state: null,
      coordinates: { lat: 48.8566, long: 2.3522 },
      source: 'geolocation',
    };
    useAppStore.setState({ homeLocation });

    const distance = calculateDistanceFromHome(48.8566, 2.3522);
    expect(distance).toBe(0);
  });

  it('calculates distance for nearby cities', () => {
    // set home location to paris
    const homeLocation: HomeLocation = {
      cityId: 1,
      cityName: 'Paris',
      country: 'France',
      state: null,
      coordinates: { lat: 48.8566, long: 2.3522 },
      source: 'manual',
    };
    useAppStore.setState({ homeLocation });

    // calculate distance to london (approximately 344 km)
    const distance = calculateDistanceFromHome(51.5074, -0.1278);
    expect(distance).toBeCloseTo(344, -1); // within 10km
  });

  it('handles negative coordinates', () => {
    // set home location to sydney
    const homeLocation: HomeLocation = {
      cityId: 1,
      cityName: 'Sydney',
      country: 'Australia',
      state: 'New South Wales',
      coordinates: { lat: -33.8688, long: 151.2093 },
      source: 'geolocation',
    };
    useAppStore.setState({ homeLocation });

    // calculate distance to melbourne (approximately 714 km)
    const distance = calculateDistanceFromHome(-37.8136, 144.9631);
    expect(distance).toBeCloseTo(714, -1);
  });

  it('handles coordinates crossing the equator', () => {
    // set home location to singapore
    const homeLocation: HomeLocation = {
      cityId: 1,
      cityName: 'Singapore',
      country: 'Singapore',
      state: null,
      coordinates: { lat: 1.3521, long: 103.8198 },
      source: 'manual',
    };
    useAppStore.setState({ homeLocation });

    // calculate distance to sydney (approximately 6300 km)
    const distance = calculateDistanceFromHome(-33.8688, 151.2093);
    expect(distance).toBeCloseTo(6300, -2);
  });

  it('handles coordinates crossing the prime meridian', () => {
    // set home location to london
    const homeLocation: HomeLocation = {
      cityId: 1,
      cityName: 'London',
      country: 'United Kingdom',
      state: null,
      coordinates: { lat: 51.5074, long: -0.1278 },
      source: 'geolocation',
    };
    useAppStore.setState({ homeLocation });

    // calculate distance to new york (approximately 5570 km)
    const distance = calculateDistanceFromHome(40.7128, -74.006);
    expect(distance).toBeCloseTo(5570, -2);
  });
});
