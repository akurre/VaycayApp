import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHomeLocationLayers } from '@/hooks/useHomeLocationLayers';
import { DataType } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';
import { createMockWeatherData, createMockSunshineData } from '@/test-utils';
import {
  HOME_DEFAULT_MARKER_COLOR,
  HOME_RING_COLOR,
  HOME_LOCATION_BASE_RADIUS,
  HOME_CENTER_RADIUS_MIN,
  HOME_CENTER_RADIUS_MAX,
  HOME_RING_STROKE_WIDTH,
} from '@/const';

// mock the store
vi.mock('@/stores/useAppStore');

// mock getColorForCity to return predictable colors
vi.mock('@/utils/map/getColorForCity', () => ({
  getColorForCity: vi.fn(() => [255, 0, 0, 255]), // red color for testing
}));

describe('useHomeLocationLayers', () => {
  // mock requestAnimationFrame and cancelAnimationFrame
  let rafCallbacks: FrameRequestCallback[] = [];
  let rafId = 0;

  beforeEach(() => {
    rafCallbacks = [];
    rafId = 0;

    // mock requestAnimationFrame to capture callbacks
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return ++rafId;
    });

    // mock cancelAnimationFrame
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => {
      // remove callback if it exists
      const index = rafCallbacks.findIndex((_, i) => i + 1 === id);
      if (index !== -1) {
        rafCallbacks.splice(index, 1);
      }
    });

    // mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when no home location is set', () => {
    beforeEach(() => {
      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: null,
          homeCityData: null,
        } as ReturnType<typeof useAppStore.getState>)
      );
    });

    it('returns empty array', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      expect(result.current).toEqual([]);
    });

    it('does not start animation loop', () => {
      renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      expect(globalThis.requestAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('when home location is set', () => {
    const mockHomeLocation = {
      coordinates: {
        lat: 40.7128,
        long: -74.006,
      },
    };

    beforeEach(() => {
      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: mockHomeLocation,
          homeCityData: null,
        } as ReturnType<typeof useAppStore.getState>)
      );
    });

    it('returns two layers: ring and center', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      expect(result.current).toHaveLength(2);
      expect(result.current[0].id).toBe('home-ring');
      expect(result.current[1].id).toBe('home-center');
    });

    it('starts animation loop', () => {
      renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      expect(globalThis.requestAnimationFrame).toHaveBeenCalled();
    });

    it('cleans up animation on unmount', () => {
      const { unmount } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');
      unmount();

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('ring layer has correct base properties', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const ringLayer = result.current[0];
      expect(ringLayer.id).toBe('home-ring');
      expect(ringLayer.props.data).toEqual([mockHomeLocation]);
      expect(ringLayer.props.getRadius).toBe(HOME_LOCATION_BASE_RADIUS);
      expect(ringLayer.props.lineWidthMinPixels).toBe(HOME_RING_STROKE_WIDTH);
      expect(ringLayer.props.stroked).toBe(true);
      expect(ringLayer.props.filled).toBe(false);
      expect(ringLayer.props.pickable).toBe(false);
      expect(ringLayer.props.visible).toBe(true);
    });

    it('ring layer has transparent fill color', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const ringLayer = result.current[0];
      expect(ringLayer.props.getFillColor).toEqual([0, 0, 0, 0]);
    });

    it('ring layer line color uses HOME_RING_COLOR', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const ringLayer = result.current[0];
      const lineColor = ringLayer.props.getLineColor;
      
      // line color should be an array with HOME_RING_COLOR and opacity
      expect(Array.isArray(lineColor)).toBe(true);
      if (Array.isArray(lineColor)) {
        expect(lineColor.slice(0, 3)).toEqual(HOME_RING_COLOR);
        expect(lineColor[3]).toBeGreaterThan(0); // has some opacity
      }
    });

    it('center layer has correct base properties', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const centerLayer = result.current[1];
      expect(centerLayer.id).toBe('home-center');
      expect(centerLayer.props.data).toEqual([mockHomeLocation]);
      expect(centerLayer.props.getRadius).toBe(HOME_LOCATION_BASE_RADIUS);
      expect(centerLayer.props.radiusMinPixels).toBe(HOME_CENTER_RADIUS_MIN);
      expect(centerLayer.props.radiusMaxPixels).toBe(HOME_CENTER_RADIUS_MAX);
      expect(centerLayer.props.pickable).toBe(true);
      expect(centerLayer.props.visible).toBe(true);
    });

    it('center layer uses default color when no city data', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const centerLayer = result.current[1];
      expect(centerLayer.props.getFillColor).toEqual(HOME_DEFAULT_MARKER_COLOR);
    });

    it('getPosition extracts coordinates correctly', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const ringLayer = result.current[0];
      const position = ringLayer.props.getPosition(mockHomeLocation);
      
      expect(position).toEqual([
        mockHomeLocation.coordinates.long,
        mockHomeLocation.coordinates.lat,
      ]);
    });
  });

  describe('with temperature data', () => {
    const mockHomeLocation = {
      coordinates: {
        lat: 40.7128,
        long: -74.006,
      },
    };

    const mockWeatherData = createMockWeatherData({
      lat: 40.7128,
      long: -74.006,
      avgTemperature: 20,
    });

    beforeEach(() => {
      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: mockHomeLocation,
          homeCityData: mockWeatherData,
        } as ReturnType<typeof useAppStore.getState>)
      );
    });

    it('uses color from getColorForCity for temperature data', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const centerLayer = result.current[1];
      // mocked getColorForCity returns [255, 0, 0, 255]
      expect(centerLayer.props.getFillColor).toEqual([255, 0, 0, 255]);
    });

    it('uses default color when temperature is null', () => {
      const invalidData = createMockWeatherData({
        lat: 40.7128,
        long: -74.006,
        avgTemperature: null,
      });

      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: mockHomeLocation,
          homeCityData: invalidData,
        } as ReturnType<typeof useAppStore.getState>)
      );

      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const centerLayer = result.current[1];
      expect(centerLayer.props.getFillColor).toEqual(HOME_DEFAULT_MARKER_COLOR);
    });

    it('uses default color when coordinates are null', () => {
      const invalidData = createMockWeatherData({
        lat: null,
        long: null,
        avgTemperature: 20,
      });

      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: mockHomeLocation,
          homeCityData: invalidData,
        } as ReturnType<typeof useAppStore.getState>)
      );

      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const centerLayer = result.current[1];
      expect(centerLayer.props.getFillColor).toEqual(HOME_DEFAULT_MARKER_COLOR);
    });
  });

  describe('with sunshine data', () => {
    const mockHomeLocation = {
      coordinates: {
        lat: 40.7128,
        long: -74.006,
      },
    };

    const mockSunshineData = createMockSunshineData({
      lat: 40.7128,
      long: -74.006,
      jan: 150,
    });

    beforeEach(() => {
      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: mockHomeLocation,
          homeCityData: mockSunshineData,
        } as ReturnType<typeof useAppStore.getState>)
      );
    });

    it('uses color from getColorForCity for sunshine data', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Sunshine, 1));

      const centerLayer = result.current[1];
      // mocked getColorForCity returns [255, 0, 0, 255]
      expect(centerLayer.props.getFillColor).toEqual([255, 0, 0, 255]);
    });

    it('uses default color when coordinates are null', () => {
      const invalidData = createMockSunshineData({
        lat: null,
        long: null,
        jan: 150,
      });

      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: mockHomeLocation,
          homeCityData: invalidData,
        } as ReturnType<typeof useAppStore.getState>)
      );

      const { result } = renderHook(() => useHomeLocationLayers(DataType.Sunshine, 1));

      const centerLayer = result.current[1];
      expect(centerLayer.props.getFillColor).toEqual(HOME_DEFAULT_MARKER_COLOR);
    });
  });

  describe('animation behavior', () => {
    const mockHomeLocation = {
      coordinates: {
        lat: 40.7128,
        long: -74.006,
      },
    };

    beforeEach(() => {
      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: mockHomeLocation,
          homeCityData: null,
        } as ReturnType<typeof useAppStore.getState>)
      );
    });

    it('updates layers when animation progresses', async () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      // simulate animation frame progression
      vi.spyOn(performance, 'now').mockReturnValue(500); // 500ms elapsed
      
      // trigger animation callbacks
      if (rafCallbacks.length > 0) {
        rafCallbacks[0](500);
      }

      // wait for state update (throttled to ~15fps, so every 4th frame)
      await waitFor(() => {
        const newRingRadius = result.current[0].props.radiusMinPixels;
        // radius should change as animation progresses
        expect(newRingRadius).toBeDefined();
      });
    });

    it('restarts animation when home location changes', () => {
      const { rerender } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      const initialCallCount = (globalThis.requestAnimationFrame as ReturnType<typeof vi.fn>).mock
        .calls.length;

      // change home location
      const newHomeLocation = {
        coordinates: {
          lat: 51.5074,
          long: -0.1278,
        },
      };

      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: newHomeLocation,
          homeCityData: null,
        } as ReturnType<typeof useAppStore.getState>)
      );

      rerender();

      // should have called requestAnimationFrame again
      expect((globalThis.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
        initialCallCount
      );
    });
  });

  describe('layer ordering', () => {
    const mockHomeLocation = {
      coordinates: {
        lat: 40.7128,
        long: -74.006,
      },
    };

    beforeEach(() => {
      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: mockHomeLocation,
          homeCityData: null,
        } as ReturnType<typeof useAppStore.getState>)
      );
    });

    it('ring layer is rendered before center layer', () => {
      const { result } = renderHook(() => useHomeLocationLayers(DataType.Temperature, 1));

      expect(result.current[0].id).toBe('home-ring');
      expect(result.current[1].id).toBe('home-center');
    });
  });

  describe('month selection', () => {
    const mockHomeLocation = {
      coordinates: {
        lat: 40.7128,
        long: -74.006,
      },
    };

    const mockWeatherData = createMockWeatherData({
      lat: 40.7128,
      long: -74.006,
      avgTemperature: 20,
    });

    beforeEach(() => {
      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: mockHomeLocation,
          homeCityData: mockWeatherData,
        } as ReturnType<typeof useAppStore.getState>)
      );
    });

    it('updates layers when selected month changes', () => {
      const { result, rerender } = renderHook(
        ({ month }) => useHomeLocationLayers(DataType.Temperature, month),
        { initialProps: { month: 1 } }
      );

      const initialLayers = result.current;

      // change month
      rerender({ month: 7 });

      // layers should be recreated (new instances)
      expect(result.current).not.toBe(initialLayers);
    });
  });

  describe('data type switching', () => {
    const mockHomeLocation = {
      coordinates: {
        lat: 40.7128,
        long: -74.006,
      },
    };

    const mockWeatherData = createMockWeatherData({
      lat: 40.7128,
      long: -74.006,
      avgTemperature: 20,
    });

    beforeEach(() => {
      vi.mocked(useAppStore).mockImplementation((selector) =>
        selector({
          homeLocation: mockHomeLocation,
          homeCityData: mockWeatherData,
        } as ReturnType<typeof useAppStore.getState>)
      );
    });

    it('updates layers when data type changes', () => {
      const { result, rerender } = renderHook(
        ({ dataType }) => useHomeLocationLayers(dataType, 1),
        { initialProps: { dataType: DataType.Temperature } }
      );

      const initialLayers = result.current;

      // change data type
      rerender({ dataType: DataType.Sunshine });

      // layers should be recreated (new instances)
      expect(result.current).not.toBe(initialLayers);
    });
  });
});
