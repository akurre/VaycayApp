import { useState, useCallback } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import { getTooltipContent } from '../utils/map/getTooltipContent';
import type { DataType, ViewMode, WeatherDataUnion } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';

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
  selectedMonth?: number
) => {
  const [selectedCity, setSelectedCity] = useState<WeatherDataUnion | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const homeLocation = useAppStore((state) => state.homeLocation);
  const homeCityData = useAppStore((state) => state.homeCityData);

  const handleHover = useCallback(
    (info: PickingInfo) => {
      // Handle home location hover
      if (info.layer?.id === 'home-center') {
        if (homeCityData) {
          setHoverInfo({
            x: info.x,
            y: info.y,
            content: getTooltipContent(
              [homeCityData],
              homeCityData.long!,
              homeCityData.lat!,
              dataType,
              selectedMonth
            )!,
          });
        } else if (homeLocation) {
          // Fallback: show just the city name if no data available
          setHoverInfo({
            x: info.x,
            y: info.y,
            content: `${homeLocation.cityName}, ${homeLocation.country}`,
          });
        }
        return;
      }

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
    [cities, viewMode, dataType, selectedMonth, homeCityData, homeLocation]
  );

  const handleClick = useCallback(
    (info: PickingInfo) => {
      // check if home location center was clicked
      if (info.layer?.id === 'home-center' && homeCityData) {
        setSelectedCity(homeCityData);
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
    [cities, viewMode, homeCityData]
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
