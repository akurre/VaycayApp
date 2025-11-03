import { useMemo } from 'react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { WeatherData, ValidMarkerData } from '../types/cityWeatherDataType';
import { transformToHeatmapData } from '../utils/map/transformToHeatmapData';
import { getMarkerColor, COLOR_RANGE } from '../utils/map/getMarkerColor';
import type { ViewMode } from '../components/Map/WorldMap';

/**
 * hook to create and manage deck.gl map layers for both heatmap and marker views.
 * pre-creates both layers and toggles visibility to prevent expensive layer recreation during view mode transitions.
 */

export const useMapLayers = (cities: WeatherData[], viewMode: ViewMode) => {
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
            duration: 500,
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
        getFillColor: (d) => getMarkerColor(d.avgTemperature),
        getRadius: 50000,
        radiusMinPixels: 3,
        radiusMaxPixels: 8,
        pickable: true,
        opacity: 0.8,
        visible: viewMode === 'markers',
        transitions: {
          getFillColor: {
            duration: 500,
            easing: (t: number) => t * (2 - t),
          },
        },
      }),
    ];
  }, [cities, heatmapData, viewMode]);
};
