import { useMemo } from 'react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer, IconLayer } from '@deck.gl/layers';
import { Layer } from '@deck.gl/core';
import { WeatherData, ValidMarkerData } from '../types/cityWeatherDataType';
import { SunshineData } from '@/types/sunshineDataType';
import { transformToHeatmapData } from '../utils/map/transformToHeatmapData';
import { transformToSunshineHeatmapData } from '../utils/map/transformToSunshineHeatmapData';
import { getMarkerColor, COLOR_RANGE } from '../utils/map/getMarkerColor';
import { DataType, ViewMode, WeatherDataUnion } from '@/types/mapTypes';
import { HomeLocation } from '@/types/userLocationType';
import {
  HOME_ICON_SIZE,
  HOME_ICON_OBJECT,
  SUNSHINE_COLOR_RANGE,
  ColorCacheEntry,
  SUNSHINE_LOADING_COLOR,
  TEMPERATURE_LOADING_COLOR,
} from '@/constants';
import getSunshineMarkerColor from '@/utils/map/getSunshineMarkerColor';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';

/**
 * hook to create and manage deck.gl map layers for both heatmap and marker views.
 * pre-creates both layers and toggles visibility to prevent expensive layer recreation during view mode transitions.
 * uses css-style transitions for smooth fade-in of new data points.
 * implements progressive loading with staggered marker appearance for improved perceived performance.
 * supports both temperature and sunshine data visualization.
 */

// Type guard to check if a city is a WeatherData object
const isWeatherData = (city: WeatherDataUnion): city is WeatherData => {
  return 'avgTemperature' in city;
};

// Type guard to check if a city is a SunshineData object
const isSunshineData = (city: WeatherDataUnion): city is SunshineData => {
  return 'jan' in city;
};

// Type guard for valid marker data with sunshine
interface ValidSunshineMarkerData extends SunshineData {
  lat: number;
  long: number;
}

interface UseMapLayersProps {
  cities: WeatherDataUnion[];
  viewMode: ViewMode;
  dataType: DataType;
  selectedMonth?: number;
  isLoadingWeather: boolean;
  homeLocation: HomeLocation | null;
}

function useMapLayers({
  // todo split up
  cities,
  viewMode,
  dataType,
  selectedMonth = 1,
  isLoadingWeather,
  homeLocation,
}: UseMapLayersProps) {
  // Get max cities to show from appropriate store
  const maxTemperatureCities = useWeatherStore((state) => state.maxCitiesToShow || 300);
  const maxSunshineCities = useSunshineStore((state) => state.maxCitiesToShow || 300);
  const maxCitiesToShow =
    dataType === DataType.Temperature ? maxTemperatureCities : maxSunshineCities;
  // Transform data based on data type
  const heatmapData = useMemo(() => {
    if (dataType === DataType.Temperature) {
      // Filter to only WeatherData objects
      const weatherCities = cities.filter(isWeatherData) as WeatherData[];
      return transformToHeatmapData(weatherCities);
    } else {
      // Filter to only SunshineData objects
      const sunshineCities = cities.filter(isSunshineData) as SunshineData[];
      return transformToSunshineHeatmapData(sunshineCities, selectedMonth);
    }
  }, [cities, dataType, selectedMonth]);

  // Temperature color cache - only calculate when needed
  const temperatureColorCache = useMemo(() => {
    if (dataType !== DataType.Temperature) return null;

    const cache = new Map<string, ColorCacheEntry>();

    // Only process the first maxCitiesToShow cities that have valid data
    const validCities = cities
      .filter(
        (c): c is ValidMarkerData =>
          isWeatherData(c) && c.lat !== null && c.long !== null && c.avgTemperature !== null
      )
      .slice(0, maxCitiesToShow);

    // Pre-calculate colors for all valid cities
    validCities.forEach((city) => {
      const weatherData = city as WeatherData;
      const [r, g, b] = getMarkerColor(weatherData.avgTemperature || 0);
      // Use city ID as key (combination of name and coordinates for uniqueness)
      const key = `${weatherData.city}_${weatherData.lat}_${weatherData.long}`;
      cache.set(key, [r, g, b, 255]);
    });

    return cache;
  }, [cities, dataType, maxCitiesToShow]);

  // Sunshine color cache - only calculate when needed
  const sunshineColorCache = useMemo(() => {
    if (dataType !== DataType.Sunshine) return null;

    const cache = new Map<string, ColorCacheEntry>();
    const monthFields: Record<number, keyof SunshineData> = {
      1: 'jan',
      2: 'feb',
      3: 'mar',
      4: 'apr',
      5: 'may',
      6: 'jun',
      7: 'jul',
      8: 'aug',
      9: 'sep',
      10: 'oct',
      11: 'nov',
      12: 'dec',
    };
    const monthField = monthFields[selectedMonth];

    // Only process the first maxCitiesToShow cities that have valid data
    const validCities = cities
      .filter((c): c is ValidSunshineMarkerData => {
        if (!isSunshineData(c) || c.lat === null || c.long === null) return false;
        return c[monthField] !== null;
      })
      .slice(0, maxCitiesToShow);

    // Pre-calculate colors for all valid cities
    validCities.forEach((city) => {
      const sunshineData = city as SunshineData;
      const sunshineHours = sunshineData[monthField] as number | null;
      // Handle null values safely
      const [r, g, b] = getSunshineMarkerColor(sunshineHours !== null ? sunshineHours : 0);
      // Use city ID as key (combination of name and coordinates for uniqueness)
      const key = `${sunshineData.city}_${sunshineData.lat}_${sunshineData.long}`;
      cache.set(key, [r, g, b, 255]);
    });

    return cache;
  }, [cities, dataType, selectedMonth, maxCitiesToShow]);

  // memoize home icon layer separately to avoid recreating city layers when home location changes
  const homeIconLayer = useMemo(() => {
    if (!homeLocation) return null;

    return new IconLayer({
      id: 'home-icon',
      data: [homeLocation],
      getPosition: (d) => [d.coordinates.long, d.coordinates.lat],
      getIcon: () => HOME_ICON_OBJECT, // use cached icon object
      getSize: HOME_ICON_SIZE,
      pickable: true,
      // always visible regardless of view mode
      visible: true,
    });
  }, [homeLocation]);

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
      // Temperature markers with color caching
      layers.push(
        new ScatterplotLayer<ValidMarkerData>({
          id: 'temperature-markers',
          data: cities
            .filter(
              (c): c is ValidMarkerData =>
                isWeatherData(c) && c.lat !== null && c.long !== null && c.avgTemperature !== null
            )
            .slice(0, maxCitiesToShow),
          getPosition: (d) => [d.long, d.lat],
          getFillColor: (d) => {
            if (!temperatureColorCache) return TEMPERATURE_LOADING_COLOR;

            const weatherData = d as WeatherData;
            const key = `${weatherData.city}_${weatherData.lat}_${weatherData.long}`;

            // Use cached color if available, otherwise use loading color
            return temperatureColorCache.get(key) || TEMPERATURE_LOADING_COLOR;
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
      // Sunshine markers with color caching
      const monthFields: Record<number, keyof SunshineData> = {
        1: 'jan',
        2: 'feb',
        3: 'mar',
        4: 'apr',
        5: 'may',
        6: 'jun',
        7: 'jul',
        8: 'aug',
        9: 'sep',
        10: 'oct',
        11: 'nov',
        12: 'dec',
      };

      layers.push(
        new ScatterplotLayer<ValidSunshineMarkerData>({
          id: 'sunshine-markers',
          data: cities
            .filter((c): c is ValidSunshineMarkerData => {
              if (!isSunshineData(c) || c.lat === null || c.long === null) return false;

              // Check if the selected month has data
              const monthField = monthFields[selectedMonth];
              return c[monthField] !== null;
            })
            .slice(0, maxCitiesToShow),
          getPosition: (d) => [d.long, d.lat],
          getFillColor: (d) => {
            if (!sunshineColorCache) return SUNSHINE_LOADING_COLOR;

            const sunshineData = d as SunshineData;
            const key = `${sunshineData.city}_${sunshineData.lat}_${sunshineData.long}`;

            // Use cached color if available, otherwise use loading color
            return sunshineColorCache.get(key) || SUNSHINE_LOADING_COLOR;
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

    // add home icon layer if it exists
    if (homeIconLayer) {
      layers.push(homeIconLayer);
    }

    return layers;
  }, [
    cities,
    heatmapData,
    viewMode,
    isLoadingWeather,
    homeIconLayer,
    temperatureColorCache,
    sunshineColorCache,
    maxCitiesToShow,
    dataType,
    selectedMonth,
  ]);
}

export default useMapLayers;
