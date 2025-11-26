import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUserLocation } from '@/hooks/useUserLocation';
import { useAppStore } from '@/stores/useAppStore';
import { LocationSource } from '@/types/userLocationType';
import { createMockGeolocationPosition, createMockNearestCity } from '@/test-utils';
import * as parseErrorModule from '@/utils/errors/parseErrorAndNotify';

// mock the store
vi.mock('@/stores/useAppStore');

// mock parseErrorAndNotify
vi.mock('@/utils/errors/parseErrorAndNotify', () => ({
  parseErrorAndNotify: vi.fn(),
}));

// mock apollo client
const mockGetNearestCity = vi.fn();
vi.mock('@apollo/client/react', () => ({
  useLazyQuery: vi.fn(() => [mockGetNearestCity]),
}));

describe('useUserLocation', () => {
  const mockSetHomeLocation = vi.fn();
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
  };

  beforeEach(() => {
    // reset all mocks
    vi.clearAllMocks();

    // mock store
    vi.mocked(useAppStore).mockImplementation((selector) =>
      selector({
        setHomeLocation: mockSetHomeLocation,
      } as unknown as ReturnType<typeof useAppStore.getState>)
    );

    // mock geolocation api
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('returns requestLocation function and isLoading false', () => {
      const { result } = renderHook(() => useUserLocation());

      expect(result.current.requestLocation).toBeInstanceOf(Function);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('when geolocation is not supported', () => {
    beforeEach(() => {
      // remove geolocation support
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('calls parseErrorAndNotify with appropriate error', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(parseErrorModule.parseErrorAndNotify).toHaveBeenCalledWith(
        expect.any(Error),
        'geolocation unavailable'
      );
    });

    it('sets isLoading to false after error', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('does not call setHomeLocation', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockSetHomeLocation).not.toHaveBeenCalled();
    });
  });

  describe('successful geolocation and city lookup', () => {
    const mockPosition = createMockGeolocationPosition();
    const mockNearestCity = createMockNearestCity();

    beforeEach(() => {
      // mock successful geolocation
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      // mock successful city lookup
      mockGetNearestCity.mockResolvedValue({
        data: { nearestCity: mockNearestCity },
        error: null,
      });
    });

    it('sets isLoading to true during request', async () => {
      const { result } = renderHook(() => useUserLocation());

      act(() => {
        result.current.requestLocation();
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('calls getCurrentPosition with correct options', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });

    it('queries nearest city with correct coordinates', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockGetNearestCity).toHaveBeenCalledWith({
        variables: {
          lat: mockPosition.coords.latitude,
          long: mockPosition.coords.longitude,
        },
      });
    });

    it('sets home location with correct data', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockSetHomeLocation).toHaveBeenCalledWith({
        cityId: mockNearestCity.id,
        cityName: mockNearestCity.name,
        country: mockNearestCity.country,
        state: mockNearestCity.state,
        coordinates: {
          lat: mockNearestCity.lat,
          long: mockNearestCity.long,
        },
        source: LocationSource.Geolocation,
      });
    });

    it('sets isLoading to false after success', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('does not call parseErrorAndNotify on success', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(parseErrorModule.parseErrorAndNotify).not.toHaveBeenCalled();
    });
  });

  describe('geolocation errors', () => {
    const mockGeolocationError: GeolocationPositionError = {
      code: 1,
      message: 'User denied geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    beforeEach(() => {
      // mock geolocation error
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        if (error) error(mockGeolocationError);
      });
    });

    it('calls parseErrorAndNotify with geolocation error', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(parseErrorModule.parseErrorAndNotify).toHaveBeenCalledWith(
        mockGeolocationError
      );
    });

    it('sets isLoading to false after error', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('does not call setHomeLocation', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockSetHomeLocation).not.toHaveBeenCalled();
    });

    it('does not call getNearestCity', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockGetNearestCity).not.toHaveBeenCalled();
    });
  });

  describe('graphql query errors', () => {
    const mockPosition = createMockGeolocationPosition();

    beforeEach(() => {
      // mock successful geolocation
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });
    });

    it('handles query error', async () => {
      const mockError = new Error('network error');
      mockGetNearestCity.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(parseErrorModule.parseErrorAndNotify).toHaveBeenCalledWith(mockError);
    });

    it('handles missing data', async () => {
      mockGetNearestCity.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(parseErrorModule.parseErrorAndNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'no nearby cities found',
        })
      );
    });

    it('handles missing nearestCity in data', async () => {
      mockGetNearestCity.mockResolvedValue({
        data: { nearestCity: null },
        error: null,
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(parseErrorModule.parseErrorAndNotify).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'no nearby cities found',
        })
      );
    });

    it('sets isLoading to false after query error', async () => {
      mockGetNearestCity.mockResolvedValue({
        data: null,
        error: new Error('network error'),
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('does not call setHomeLocation on query error', async () => {
      mockGetNearestCity.mockResolvedValue({
        data: null,
        error: new Error('network error'),
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockSetHomeLocation).not.toHaveBeenCalled();
    });
  });

  describe('multiple requests', () => {
    const mockPosition = createMockGeolocationPosition();
    const mockNearestCity = createMockNearestCity();

    beforeEach(() => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      mockGetNearestCity.mockResolvedValue({
        data: { nearestCity: mockNearestCity },
        error: null,
      });
    });

    it('can handle multiple sequential requests', async () => {
      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockSetHomeLocation).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockSetHomeLocation).toHaveBeenCalledTimes(2);
    });

    it('maintains stable requestLocation reference', () => {
      const { result, rerender } = renderHook(() => useUserLocation());

      const firstRequestLocation = result.current.requestLocation;
      rerender();

      expect(result.current.requestLocation).toBe(firstRequestLocation);
    });
  });

  describe('edge cases', () => {
    it('handles city with null state', async () => {
      const mockPosition = createMockGeolocationPosition();
      const mockNearestCity = createMockNearestCity({ state: null });

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      mockGetNearestCity.mockResolvedValue({
        data: { nearestCity: mockNearestCity },
        error: null,
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockSetHomeLocation).toHaveBeenCalledWith(
        expect.objectContaining({
          state: null,
        })
      );
    });

    it('handles rejected promise from getCurrentPosition', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        if (error) {
          error({
            code: 3,
            message: 'timeout',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
        }
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(parseErrorModule.parseErrorAndNotify).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('handles query rejection', async () => {
      const mockPosition = createMockGeolocationPosition();

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const mockError = new Error('query failed');
      mockGetNearestCity.mockRejectedValue(mockError);

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(parseErrorModule.parseErrorAndNotify).toHaveBeenCalledWith(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('location source', () => {
    it('always sets source to Geolocation', async () => {
      const mockPosition = createMockGeolocationPosition();
      const mockNearestCity = createMockNearestCity();

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      mockGetNearestCity.mockResolvedValue({
        data: { nearestCity: mockNearestCity },
        error: null,
      });

      const { result } = renderHook(() => useUserLocation());

      await act(async () => {
        await result.current.requestLocation();
      });

      expect(mockSetHomeLocation).toHaveBeenCalledWith(
        expect.objectContaining({
          source: LocationSource.Geolocation,
        })
      );
    });
  });
});
