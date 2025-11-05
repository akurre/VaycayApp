import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/useAppStore';
import { MapTheme } from '@/types/mapTypes';
import { LocationSource } from '@/types/userLocationType';

describe('useAppStore', () => {
  beforeEach(() => {
    // reset store state before each test
    useAppStore.setState({
      theme: MapTheme.Dark,
      homeLocation: null,
      isLocationLoading: false,
      locationError: null,
    });
  });

  describe('theme', () => {
    it('initializes with dark theme', () => {
      const { theme } = useAppStore.getState();
      expect(theme).toBe(MapTheme.Dark);
    });

    it('updates theme', () => {
      const { setTheme } = useAppStore.getState();
      setTheme(MapTheme.Light);
      expect(useAppStore.getState().theme).toBe(MapTheme.Light);
    });
  });

  describe('homeLocation', () => {
    it('initializes with null home location', () => {
      const { homeLocation } = useAppStore.getState();
      expect(homeLocation).toBeNull();
    });

    it('sets home location from geolocation', () => {
      const { setHomeLocation } = useAppStore.getState();
      const location = {
        cityId: 1,
        cityName: 'New York',
        country: 'United States',
        state: 'New York',
        coordinates: { lat: 40.7128, long: -74.006 },
        source: LocationSource.Geolocation,
      };

      setHomeLocation(location);
      expect(useAppStore.getState().homeLocation).toEqual(location);
    });

    it('sets home location from manual selection', () => {
      const { setHomeLocation } = useAppStore.getState();
      const location = {
        cityId: 2,
        cityName: 'Paris',
        country: 'France',
        state: null,
        coordinates: { lat: 48.8566, long: 2.3522 },
        source: LocationSource.Manual,
      };

      setHomeLocation(location);
      expect(useAppStore.getState().homeLocation).toEqual(location);
    });

    it('clears home location', () => {
      const { setHomeLocation } = useAppStore.getState();
      const location = {
        cityId: 1,
        cityName: 'New York',
        country: 'United States',
        state: 'New York',
        coordinates: { lat: 40.7128, long: -74.006 },
        source: LocationSource.Geolocation,
      };

      setHomeLocation(location);
      expect(useAppStore.getState().homeLocation).not.toBeNull();

      setHomeLocation(null);
      expect(useAppStore.getState().homeLocation).toBeNull();
    });
  });

  describe('loading state', () => {
    it('initializes with loading false', () => {
      const { isLocationLoading } = useAppStore.getState();
      expect(isLocationLoading).toBe(false);
    });

    it('updates loading state', () => {
      const { setIsLocationLoading } = useAppStore.getState();
      setIsLocationLoading(true);
      expect(useAppStore.getState().isLocationLoading).toBe(true);

      setIsLocationLoading(false);
      expect(useAppStore.getState().isLocationLoading).toBe(false);
    });
  });

  describe('error state', () => {
    it('initializes with null error', () => {
      const { locationError } = useAppStore.getState();
      expect(locationError).toBeNull();
    });

    it('sets error message', () => {
      const { setLocationError } = useAppStore.getState();
      const errorMessage = 'location permission denied';

      setLocationError(errorMessage);
      expect(useAppStore.getState().locationError).toBe(errorMessage);
    });

    it('clears error message', () => {
      const { setLocationError } = useAppStore.getState();
      setLocationError('some error');
      expect(useAppStore.getState().locationError).not.toBeNull();

      setLocationError(null);
      expect(useAppStore.getState().locationError).toBeNull();
    });
  });
});
