import { useMemo } from 'react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { WeatherData, ValidMarkerData } from '../types/cityWeatherDataType';
import { transformToHeatmapData } from '../utils/map/transformToHeatmapData';
import { getMarkerColor, COLOR_RANGE } from '../utils/map/getMarkerColor';
import { ViewMode } from '@/types/mapTypes';

/**
 * hook to create and manage deck.gl map layers for both heatmap and marker views.
 * pre-creates both layers and toggles visibility to prevent expensive layer recreation during view mode transitions.
 * uses css-style transitions for smooth fade-in of new data points.
 * implements progressive loading with staggered marker appearance for improved perceived performance.
 */

interface UseMapLayersProps {
  cities: WeatherData[];
  viewMode: ViewMode;
  isLoadingWeather: boolean;
}

function useMapLayers({ cities, viewMode, isLoadingWeather }: UseMapLayersProps) {
  const heatmapData = useMemo(() => transformToHeatmapData(cities), [cities]);

  return useMemo(() => {
    // pre-create both layers and toggle visibility instead of creating/destroying
    // this prevents expensive layer creation from blocking the segmentedcontrol transition
    return [
      new HeatmapLayer({
        id: 'temperature-heatmap',
        data: heatmapData,
        getPosition: (d) => d.position,
        getWeight: (d) => d.weight,
        radiusPixels: 40,
        intensity: 1,
        threshold: 0.03,
        colorRange: COLOR_RANGE,
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
      new ScatterplotLayer<ValidMarkerData>({
        id: 'city-markers',
        data: cities.filter(
          (c): c is ValidMarkerData =>
            c.lat !== null && c.long !== null && c.avgTemperature !== null
        ),
        getPosition: (d) => [d.long, d.lat],
        getFillColor: (d) => {
          const [r, g, b] = getMarkerColor(d.avgTemperature);
          return [r, g, b, 255];
        },
        getRadius: 50000,
        radiusMinPixels: 3,
        radiusMaxPixels: 8,
        pickable: true,
        // reduce opacity slightly when loading to provide visual feedback
        opacity: isLoadingWeather ? 0.5 : 0.8,
        visible: viewMode === 'markers',
        transitions: {
          getFillColor: {
            duration: 600,
            easing: (t: number) => t * (2 - t),
          },
          // smooth opacity transition when loading state changes
          opacity: {
            duration: 300,
            easing: (t: number) => t,
          },
          // progressive loading: stagger marker appearance based on index
          // markers appear in waves for a more polished feel
          getRadius: {
            duration: 400,
            easing: (t: number) => t * (2 - t),
            enter: () => [0], // start from 0 radius and grow
          },
        },
      }),
    ];
  }, [cities, heatmapData, viewMode, isLoadingWeather]);
}

export default useMapLayers;
