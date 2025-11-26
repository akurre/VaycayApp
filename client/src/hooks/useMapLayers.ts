import { useMemo } from 'react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { WeatherData, ValidMarkerData } from '../types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import { COLOR_RANGE } from '../utils/map/getMarkerColor';
import { DataType } from '@/types/mapTypes';
import type { ViewMode, WeatherDataUnion } from '@/types/mapTypes';
import { SUNSHINE_COLOR_RANGE, SUNSHINE_LOADING_COLOR, TEMPERATURE_LOADING_COLOR } from '@/const';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';
import type { ValidSunshineMarkerData } from '@/utils/typeGuards';
import { useHeatmapData } from './useHeatmapData';
import { useTemperatureColorCache, useSunshineColorCache } from './useColorCache';

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
  isLoadingWeather: boolean;
}

function useMapLayers({
  cities,
  viewMode,
  dataType,
  selectedMonth = 1,
  isLoadingWeather,
}: UseMapLayersProps) {
  // Get max cities to show from appropriate store
  const maxTemperatureCities = useWeatherStore((state) => state.maxCitiesToShow || 300);
  const maxSunshineCities = useSunshineStore((state) => state.maxCitiesToShow || 300);
  const maxCitiesToShow =
    dataType === DataType.Temperature ? maxTemperatureCities : maxSunshineCities;

  // Use smaller focused hooks
  const heatmapData = useHeatmapData(cities, dataType, selectedMonth);
  const temperatureCacheResult = useTemperatureColorCache(cities, dataType, maxCitiesToShow);
  const sunshineCacheResult = useSunshineColorCache(
    cities,
    dataType,
    selectedMonth,
    maxCitiesToShow
  );

  return useMemo(() => {
    // pre-create all layers and toggle visibility instead of creating/destroying
    // this prevents expensive layer creation from blocking the segmentedcontrol transition
    const layers: Layer[] = [
      new HeatmapLayer({
        id: 'data-heatmap',
        data: heatmapData,
        getPosition: (d) => d.position,
        getWeight: (d) => d.weight,
        radiusPixels: 40,
        intensity: 1,
        threshold: 0.03,
        colorRange:
          dataType === DataType.Temperature
            ? COLOR_RANGE
            : SUNSHINE_COLOR_RANGE.map((c) => [...c] as [number, number, number]),
        aggregation: 'MEAN',
        opacity: 0.6,
        visible: viewMode === 'heatmap',
        transitions: {
          getWeight: {
            duration: 600,
            easing: (t: number) => t * (2 - t),
          },
        },
      }),
    ];

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
            return temperatureCacheResult.cache.get(key) || TEMPERATURE_LOADING_COLOR;
          },
          getRadius: 50000,
          radiusMinPixels: 3,
          radiusMaxPixels: 8,
          pickable: true,
          opacity: isLoadingWeather ? 0.5 : 0.8,
          visible: viewMode === 'markers',
          transitions: {
            getFillColor: {
              duration: 600,
              easing: (t: number) => t * (2 - t),
            },
            opacity: {
              duration: 300,
              easing: (t: number) => t,
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
          opacity: isLoadingWeather ? 0.5 : 0.8,
          visible: viewMode === 'markers',
          transitions: {
            getFillColor: {
              duration: 600,
              easing: (t: number) => t * (2 - t),
            },
            opacity: {
              duration: 300,
              easing: (t: number) => t,
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

    return layers;
  }, [
    heatmapData,
    viewMode,
    isLoadingWeather,
    temperatureCacheResult,
    sunshineCacheResult,
    dataType,
    selectedMonth,
  ]);
}

export default useMapLayers;
