import { useMemo } from 'react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer, IconLayer } from '@deck.gl/layers';
import { Layer } from '@deck.gl/core';
import { WeatherData, ValidMarkerData } from '../types/cityWeatherDataType';
import { transformToHeatmapData } from '../utils/map/transformToHeatmapData';
import { getMarkerColor, COLOR_RANGE } from '../utils/map/getMarkerColor';
import { ViewMode } from '@/types/mapTypes';
import { HomeLocation } from '@/types/userLocationType';
import { HOME_ICON_SIZE, HOME_ICON_OBJECT } from '@/constants';

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
  homeLocation: HomeLocation | null;
}

function useMapLayers({ cities, viewMode, isLoadingWeather, homeLocation }: UseMapLayersProps) {
  const heatmapData = useMemo(() => transformToHeatmapData(cities), [cities]);

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

    // add home icon layer if it exists
    if (homeIconLayer) {
      layers.push(homeIconLayer);
    }

    return layers;
  }, [cities, heatmapData, viewMode, isLoadingWeather, homeIconLayer]);
}

export default useMapLayers;
