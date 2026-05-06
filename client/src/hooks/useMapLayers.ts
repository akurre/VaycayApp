import { useMemo } from 'react';
import { useComputedColorScheme } from '@mantine/core';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { Layer, MapViewState } from '@deck.gl/core';
import type {
  WeatherData,
  ValidMarkerData,
} from '../types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import { COLOR_RANGE } from '../utils/map/getMarkerColor';
import { DataType } from '@/types/mapTypes';
import type { ViewMode, WeatherDataUnion } from '@/types/mapTypes';
import {
  DOT_STROKE_LIGHT,
  SUNSHINE_COLOR_RANGE,
  SUNSHINE_LOADING_COLOR,
  TEMPERATURE_LOADING_COLOR,
  GHOST_DOT_OPACITY,
  INITIAL_VIEW_STATE,
} from '@/const';
import { useGhostDots, type GhostDot } from './useGhostDots';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';
import type { ValidSunshineMarkerData } from '@/utils/typeGuards';
import { useHeatmapData } from './useHeatmapData';
import {
  useTemperatureColorCache,
  useSunshineColorCache,
} from './useColorCache';
import { perfMonitor } from '@/utils/performance/performanceMonitor';

/**
 * hook to create and manage deck.gl map layers for both heatmap and marker views.
 * pre-creates both layers and toggles visibility to prevent expensive layer recreation during view mode transitions.
 * uses css-style transitions for smooth fade-in of new data points.
 * implements progressive loading with staggered marker appearance for improved perceived performance.
 * supports both temperature and sunshine data visualization.
 */

interface UseMapLayersProps {
  cities: WeatherDataUnion[];
  viewMode: ViewMode;
  dataType: DataType;
  selectedMonth?: number;
  breatheOpacity?: number;
  isGhostDotsActive?: boolean;
  viewState?: MapViewState;
}

function useMapLayers({
  cities,
  viewMode,
  dataType,
  selectedMonth = 1,
  breatheOpacity,
  isGhostDotsActive = false,
  viewState,
}: UseMapLayersProps) {
  // Get max cities to show from appropriate store
  const maxTemperatureCities = useWeatherStore(
    (state) => state.maxCitiesToShow || 300
  );
  const maxSunshineCities = useSunshineStore(
    (state) => state.maxCitiesToShow || 300
  );
  const maxCitiesToShow =
    dataType === DataType.Temperature
      ? maxTemperatureCities
      : maxSunshineCities;

  const defaultViewState: MapViewState = {
    latitude: INITIAL_VIEW_STATE.latitude,
    longitude: INITIAL_VIEW_STATE.longitude,
    zoom: INITIAL_VIEW_STATE.zoom,
  };

  const ghostDots = useGhostDots({
    realCities: cities,
    viewState: viewState ?? defaultViewState,
    isActive: isGhostDotsActive,
    dataType,
  });

  // Light mode: subtle ocean outline so cool-blue dots don't disappear into
  // the cream basemap. Dark mode: no outline (dots already pop on near-black).
  const colorScheme = useComputedColorScheme('dark');
  const isLightMode = colorScheme === 'light';

  // Use smaller focused hooks
  const heatmapData = useHeatmapData(cities, dataType, selectedMonth);
  const temperatureCacheResult = useTemperatureColorCache(
    cities,
    dataType,
    maxCitiesToShow
  );
  const sunshineCacheResult = useSunshineColorCache(
    cities,
    dataType,
    selectedMonth,
    maxCitiesToShow
  );

  return useMemo(() => {
    perfMonitor.start('map-layer-creation');

    const layers: Layer[] = [];

    if (ghostDots.length > 0) {
      layers.push(
        new HeatmapLayer({
          id: 'ghost-heatmap',
          data: ghostDots.map((d) => ({
            position: [d.long, d.lat] as [number, number],
            weight: 0.3,
          })),
          getPosition: (d) => d.position,
          getWeight: (d) => d.weight,
          radiusMeters: 80000,
          intensity: 0.3,
          threshold: 0.5,
          colorRange:
            dataType === DataType.Temperature
              ? COLOR_RANGE
              : SUNSHINE_COLOR_RANGE.map(
                  (c) => [...c] as [number, number, number]
                ),
          aggregation: 'MEAN',
          opacity: GHOST_DOT_OPACITY,
          visible: viewMode === 'heatmap',
        })
      );

      layers.push(
        new ScatterplotLayer<GhostDot>({
          id: 'ghost-markers',
          data: ghostDots,
          getPosition: (d) => [d.long, d.lat],
          getFillColor: (d) => d.color,
          getRadius: 50000,
          radiusMinPixels: 3,
          radiusMaxPixels: 8,
          pickable: false,
          opacity: GHOST_DOT_OPACITY,
          visible: viewMode === 'markers',
          transitions: {
            opacity: {
              duration: 200,
              easing: (t: number) => t,
            },
          },
        })
      );
    }

    layers.push(
      new HeatmapLayer({
        id: 'data-heatmap',
        data: heatmapData,
        getPosition: (d) => d.position,
        getWeight: (d) => d.weight,
        radiusMeters: 80000,
        intensity: 1,
        threshold: 0.5,
        colorRange:
          dataType === DataType.Temperature
            ? COLOR_RANGE
            : SUNSHINE_COLOR_RANGE.map(
                (c) => [...c] as [number, number, number]
              ),
        aggregation: 'MEAN',
        opacity: breatheOpacity != null ? Math.min(breatheOpacity, 0.6) : 0.6,
        visible: viewMode === 'heatmap',
      })
    );

    // Add appropriate marker layer based on data type
    if (dataType === DataType.Temperature) {
      // Temperature markers with color caching - use pre-filtered cities to avoid duplicate filtering
      layers.push(
        new ScatterplotLayer<ValidMarkerData>({
          id: 'temperature-markers',
          data: temperatureCacheResult?.validCities || [],
          getPosition: (d) => [d.long, d.lat],
          getFillColor: (d) => {
            if (!temperatureCacheResult) return TEMPERATURE_LOADING_COLOR;

            const weatherData = d as WeatherData;
            const key = `${weatherData.city}_${weatherData.lat}_${weatherData.long}`;

            // Use cached color if available, otherwise use loading color
            return (
              temperatureCacheResult.cache.get(key) || TEMPERATURE_LOADING_COLOR
            );
          },
          getRadius: 50000,
          radiusMinPixels: 3,
          radiusMaxPixels: 8,
          pickable: true,
          opacity: breatheOpacity ?? 0.8,
          visible: viewMode === 'markers',
          stroked: isLightMode,
          getLineColor: DOT_STROKE_LIGHT,
          lineWidthMinPixels: 0.5,
          lineWidthMaxPixels: 1.5,
          transitions: {
            getFillColor: {
              duration: 600,
              easing: (t: number) => t * (2 - t),
            },
            opacity: {
              duration: 550,
              easing: (t: number) => t * (2 - t),
            },
            getRadius: {
              duration: 400,
              easing: (t: number) => t * (2 - t),
              enter: () => [0],
            },
          },
        })
      );
    } else {
      // Sunshine markers with color caching - use pre-filtered cities to avoid duplicate filtering
      layers.push(
        new ScatterplotLayer<ValidSunshineMarkerData>({
          id: 'sunshine-markers',
          data: sunshineCacheResult?.validCities || [],
          getPosition: (d) => [d.long, d.lat],
          getFillColor: (d) => {
            if (!sunshineCacheResult) return SUNSHINE_LOADING_COLOR;

            const sunshineData = d as SunshineData;
            const key = `${sunshineData.city}_${sunshineData.lat}_${sunshineData.long}`;

            // Use cached color if available, otherwise use loading color
            return sunshineCacheResult.cache.get(key) || SUNSHINE_LOADING_COLOR;
          },
          getRadius: 50000,
          radiusMinPixels: 3,
          radiusMaxPixels: 8,
          pickable: true,
          opacity: breatheOpacity ?? 0.8,
          visible: viewMode === 'markers',
          stroked: isLightMode,
          getLineColor: DOT_STROKE_LIGHT,
          lineWidthMinPixels: 0.5,
          lineWidthMaxPixels: 1.5,
          transitions: {
            getFillColor: {
              duration: 600,
              easing: (t: number) => t * (2 - t),
            },
            opacity: {
              duration: 550,
              easing: (t: number) => t * (2 - t),
            },
            getRadius: {
              duration: 400,
              easing: (t: number) => t * (2 - t),
              enter: () => [0],
            },
          },
        })
      );
    }

    perfMonitor.end('map-layer-creation');

    return layers;
  }, [
    ghostDots,
    heatmapData,
    viewMode,
    breatheOpacity,
    temperatureCacheResult,
    sunshineCacheResult,
    dataType,
    selectedMonth,
    isLightMode,
  ]);
}

export default useMapLayers;
