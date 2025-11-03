import { useState, useCallback } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import { WeatherData } from '../types/cityWeatherDataType';
import { getTooltipContent } from '../utils/map/getTooltipContent';
import type { ViewMode } from '../components/Map/WorldMap';

/**
 * hook to manage map interactions including hover tooltips and city selection.
 * handles both marker and heatmap view modes with appropriate interaction logic.
 */

interface HoverInfo {
  x: number;
  y: number;
  content: string;
}

export const useMapInteractions = (cities: WeatherData[], viewMode: ViewMode) => {
  const [selectedCity, setSelectedCity] = useState<WeatherData | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const handleHover = useCallback(
    (info: PickingInfo) => {
      if (viewMode === 'markers' && info.object) {
        const city = info.object as WeatherData;
        setHoverInfo({
          x: info.x,
          y: info.y,
          content: getTooltipContent([city], city.long!, city.lat!)!,
        });
      } else if (viewMode === 'heatmap' && info.coordinate) {
        const [longitude, latitude] = info.coordinate;
        const content = getTooltipContent(cities, longitude, latitude);
        if (content) {
          setHoverInfo({
            x: info.x,
            y: info.y,
            content,
          });
        } else {
          setHoverInfo(null);
        }
      } else {
        setHoverInfo(null);
      }
    },
    [cities, viewMode]
  );

  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (viewMode === 'markers' && info.object) {
        setSelectedCity(info.object as WeatherData);
      } else if (viewMode === 'heatmap' && info.coordinate) {
        const [longitude, latitude] = info.coordinate;
        const city = cities.find(
          (c) =>
            c.lat !== null &&
            c.long !== null &&
            Math.abs(c.lat - latitude) < 0.5 &&
            Math.abs(c.long - longitude) < 0.5
        );
        if (city) {
          setSelectedCity(city);
        }
      }
    },
    [cities, viewMode]
  );

  const handleClosePopup = useCallback(() => {
    setSelectedCity(null);
  }, []);

  return {
    selectedCity,
    hoverInfo,
    handleHover,
    handleClick,
    handleClosePopup,
  };
};
