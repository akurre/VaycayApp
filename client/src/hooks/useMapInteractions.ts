import { useState, useCallback } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import { getTooltipContent } from '../utils/map/getTooltipContent';
import { DataType, ViewMode, WeatherDataUnion } from '@/types/mapTypes';
import { HomeLocation } from '@/types/userLocationType';

/**
 * hook to manage map interactions including hover tooltips and city selection.
 * handles both marker and heatmap view modes with appropriate interaction logic.
 */

interface HoverInfo {
  x: number;
  y: number;
  content: string;
}

export const useMapInteractions = (
  cities: WeatherDataUnion[],
  viewMode: ViewMode,
  dataType: DataType,
  selectedMonth?: number,
  homeLocation: HomeLocation | null = null
) => {
  const [selectedCity, setSelectedCity] = useState<WeatherDataUnion | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const handleHover = useCallback(
    (info: PickingInfo) => {
      if (viewMode === 'markers' && info.object) {
        const city = info.object as WeatherDataUnion;
        setHoverInfo({
          x: info.x,
          y: info.y,
          content: getTooltipContent([city], city.long!, city.lat!, dataType, selectedMonth)!,
        });
      } else if (viewMode === 'heatmap' && info.coordinate) {
        const [longitude, latitude] = info.coordinate;
        const content = getTooltipContent(cities, longitude, latitude, dataType, selectedMonth);
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
    [cities, viewMode, dataType, selectedMonth]
  );

  const handleClick = useCallback(
    (info: PickingInfo) => {
      // check if home icon was clicked
      if (info.layer?.id === 'home-icon' && homeLocation) {
        // find the city that matches the home location by coordinates and name
        const homeCity = cities.find(
          (c) =>
            c.city === homeLocation.cityName &&
            c.country === homeLocation.country &&
            c.lat !== null &&
            c.long !== null &&
            Math.abs(c.lat - homeLocation.coordinates.lat) < 0.01 &&
            Math.abs(c.long - homeLocation.coordinates.long) < 0.01
        );
        if (homeCity) {
          setSelectedCity(homeCity);
        }
        return;
      }

      if (viewMode === 'markers' && info.object) {
        setSelectedCity(info.object as WeatherDataUnion);
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
    [cities, viewMode, homeLocation]
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
