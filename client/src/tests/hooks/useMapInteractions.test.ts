import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMapInteractions } from '@/hooks/useMapInteractions';
import type { WeatherData } from '@/types/cityWeatherDataType';
import type { PickingInfo } from '@deck.gl/core';
import { ViewMode, DataType } from '@/types/mapTypes';

describe('useMapInteractions', () => {
  const createMockCity = (overrides?: Partial<WeatherData>): WeatherData => ({
    city: 'Milan',
    country: 'Italy',
    state: null,
    suburb: null,
    date: '0615',
    lat: 45.4642,
    long: 9.19,
    population: 1000000,
    avgTemperature: 25.5,
    minTemperature: 20.0,
    maxTemperature: 30.0,
    precipitation: 10.5,
    snowDepth: null,
    stationName: 'Milan Station',
    submitterId: 'test-1',
    ...overrides,
  });

  const createMockPickingInfo = (overrides?: Partial<PickingInfo>): PickingInfo =>
    ({
      x: 100,
      y: 200,
      coordinate: [9.19, 45.4642],
      object: null,
      index: -1,
      picked: false,
      layer: null,
      viewport: null,
      ...overrides,
    }) as PickingInfo;

  describe('initial state', () => {
    it('initializes with null selectedCity', () => {
      const { result } = renderHook(() =>
        useMapInteractions([], ViewMode.Markers, DataType.Temperature)
      );

      expect(result.current.selectedCity).toBeNull();
    });

    it('initializes with null hoverInfo', () => {
      const { result } = renderHook(() =>
        useMapInteractions([], ViewMode.Markers, DataType.Temperature)
      );

      expect(result.current.hoverInfo).toBeNull();
    });

    it('provides handler functions', () => {
      const { result } = renderHook(() =>
        useMapInteractions([], ViewMode.Markers, DataType.Temperature)
      );

      expect(typeof result.current.handleHover).toBe('function');
      expect(typeof result.current.handleClick).toBe('function');
      expect(typeof result.current.handleClosePopup).toBe('function');
    });
  });

  describe('handleHover - markers mode', () => {
    it('sets hover info when hovering over marker', async () => {
      const city = createMockCity();
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Markers, DataType.Temperature)
      );

      const pickingInfo = createMockPickingInfo({ object: city });

      act(() => {
        result.current.handleHover(pickingInfo);
      });

      // wait for throttled state update (16ms delay)
      await waitFor(() => {
        expect(result.current.hoverInfo).toEqual({
          x: 100,
          y: 200,
          content: 'Milan, Italy\n25.5°C',
        });
      });
    });

    it('clears hover info when not hovering over marker', () => {
      const city = createMockCity();
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Markers, DataType.Temperature)
      );

      // first set hover info
      act(() => {
        result.current.handleHover(createMockPickingInfo({ object: city }));
      });

      // then clear it
      act(() => {
        result.current.handleHover(createMockPickingInfo({ object: null }));
      });

      expect(result.current.hoverInfo).toBeNull();
    });
  });

  describe('handleHover - heatmap mode', () => {
    it('sets hover info when hovering over city location', async () => {
      const city = createMockCity();
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Heatmap, DataType.Temperature)
      );

      const pickingInfo = createMockPickingInfo({
        coordinate: [9.19, 45.4642],
      });

      act(() => {
        result.current.handleHover(pickingInfo);
      });

      // wait for throttled state update (16ms delay)
      await waitFor(() => {
        expect(result.current.hoverInfo).toEqual({
          x: 100,
          y: 200,
          content: 'Milan, Italy\n25.5°C',
        });
      });
    });

    it('clears hover info when hovering over empty area', () => {
      const city = createMockCity();
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Heatmap, DataType.Temperature)
      );

      const pickingInfo = createMockPickingInfo({
        coordinate: [0, 0], // far from any city
      });

      act(() => {
        result.current.handleHover(pickingInfo);
      });

      expect(result.current.hoverInfo).toBeNull();
    });

    it('clears hover info when coordinate is undefined', () => {
      const city = createMockCity();
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Heatmap, DataType.Temperature)
      );

      const pickingInfo = createMockPickingInfo({
        coordinate: undefined,
      });

      act(() => {
        result.current.handleHover(pickingInfo);
      });

      expect(result.current.hoverInfo).toBeNull();
    });
  });

  describe('handleClick - markers mode', () => {
    it('sets selected city when clicking marker', () => {
      const city = createMockCity();
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Markers, DataType.Temperature)
      );

      const pickingInfo = createMockPickingInfo({ object: city });

      act(() => {
        result.current.handleClick(pickingInfo);
      });

      expect(result.current.selectedCity).toEqual(city);
    });

    it('does not set selected city when clicking empty area', () => {
      const city = createMockCity();
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Markers, DataType.Temperature)
      );

      const pickingInfo = createMockPickingInfo({ object: null });

      act(() => {
        result.current.handleClick(pickingInfo);
      });

      expect(result.current.selectedCity).toBeNull();
    });
  });

  describe('handleClick - heatmap mode', () => {
    it('sets selected city when clicking near city location', () => {
      const city = createMockCity();
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Heatmap, DataType.Temperature)
      );

      const pickingInfo = createMockPickingInfo({
        coordinate: [9.19, 45.4642],
      });

      act(() => {
        result.current.handleClick(pickingInfo);
      });

      expect(result.current.selectedCity).toEqual(city);
    });

    it('does not set selected city when clicking far from any city', () => {
      const city = createMockCity();
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Heatmap, DataType.Temperature)
      );

      const pickingInfo = createMockPickingInfo({
        coordinate: [0, 0],
      });

      act(() => {
        result.current.handleClick(pickingInfo);
      });

      expect(result.current.selectedCity).toBeNull();
    });

    it('finds city within tolerance range', () => {
      const city = createMockCity({ lat: 45.4642, long: 9.19 });
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Heatmap, DataType.Temperature)
      );

      // click within 0.5 degree tolerance
      const pickingInfo = createMockPickingInfo({
        coordinate: [9.3, 45.6],
      });

      act(() => {
        result.current.handleClick(pickingInfo);
      });

      expect(result.current.selectedCity).toEqual(city);
    });

    it('does not find city outside tolerance range', () => {
      const city = createMockCity({ lat: 45.4642, long: 9.19 });
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Heatmap, DataType.Temperature)
      );

      // click outside 0.5 degree tolerance
      const pickingInfo = createMockPickingInfo({
        coordinate: [10.0, 46.0],
      });

      act(() => {
        result.current.handleClick(pickingInfo);
      });

      expect(result.current.selectedCity).toBeNull();
    });

    it('skips cities with null coordinates', () => {
      const cities = [
        createMockCity({ city: 'Invalid', lat: null, long: null }),
        createMockCity({ city: 'Milan', lat: 45.4642, long: 9.19 }),
      ];
      const { result } = renderHook(() =>
        useMapInteractions(cities, ViewMode.Heatmap, DataType.Temperature)
      );

      const pickingInfo = createMockPickingInfo({
        coordinate: [9.19, 45.4642],
      });

      act(() => {
        result.current.handleClick(pickingInfo);
      });

      expect(result.current.selectedCity?.city).toBe('Milan');
    });
  });

  describe('handleClosePopup', () => {
    it('clears selected city', () => {
      const city = createMockCity();
      const { result } = renderHook(() =>
        useMapInteractions([city], ViewMode.Markers, DataType.Temperature)
      );

      // first select a city
      act(() => {
        result.current.handleClick(createMockPickingInfo({ object: city }));
      });

      expect(result.current.selectedCity).toEqual(city);

      // then close popup
      act(() => {
        result.current.handleClosePopup();
      });

      expect(result.current.selectedCity).toBeNull();
    });
  });

  describe('mode switching', () => {
    it('handles switching from markers to heatmap mode', async () => {
      const city = createMockCity();
      const { result, rerender } = renderHook(
        ({
          cities,
          mode,
          dataType,
        }: {
          cities: WeatherData[];
          mode: ViewMode.Markers | ViewMode.Heatmap;
          dataType: DataType;
        }) => useMapInteractions(cities, mode, dataType),
        {
          initialProps: {
            cities: [city],
            mode: ViewMode.Markers as ViewMode.Markers | ViewMode.Heatmap,
            dataType: DataType.Temperature,
          },
        }
      );

      // hover in markers mode
      act(() => {
        result.current.handleHover(createMockPickingInfo({ object: city }));
      });

      // wait for throttled state update (16ms delay)
      await waitFor(() => {
        expect(result.current.hoverInfo).not.toBeNull();
      });

      // switch to heatmap mode
      rerender({
        cities: [city],
        mode: ViewMode.Heatmap as ViewMode.Markers | ViewMode.Heatmap,
        dataType: DataType.Temperature,
      });

      // hover should still work in heatmap mode
      act(() => {
        result.current.handleHover(
          createMockPickingInfo({ coordinate: [9.19, 45.4642], object: null })
        );
      });

      // wait for throttled state update (16ms delay)
      await waitFor(() => {
        expect(result.current.hoverInfo).not.toBeNull();
      });
    });
  });

  describe('multiple cities', () => {
    it('finds correct city among multiple cities', () => {
      const cities = [
        createMockCity({ city: 'Milan', lat: 45.4642, long: 9.19 }),
        createMockCity({ city: 'Rome', lat: 41.9028, long: 12.4964 }),
        createMockCity({ city: 'Venice', lat: 45.4408, long: 12.3155 }),
      ];
      const { result } = renderHook(() =>
        useMapInteractions(cities, ViewMode.Heatmap, DataType.Temperature)
      );

      // click near Rome
      const pickingInfo = createMockPickingInfo({
        coordinate: [12.4964, 41.9028],
      });

      act(() => {
        result.current.handleClick(pickingInfo);
      });

      expect(result.current.selectedCity?.city).toBe('Rome');
    });
  });
});
