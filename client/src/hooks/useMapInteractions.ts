import { useState, useCallback, useRef, useEffect } from 'react';
import type { PickingInfo } from '@deck.gl/core';
import type { DataType, ViewMode, WeatherDataUnion } from '@/types/mapTypes';
import { getTooltipContent } from '../utils/map/getTooltipContent';
import { useAppStore } from '@/stores/useAppStore';
import useIsMobileOrSmall from '@/hooks/useIsMobileOrSmall';

/**
 * Manages map interactions: hover tooltips (desktop) and tap-tooltip (mobile).
 * On mobile a marker tap sets hoverInfo with an embedded city so MapTooltip
 * can render a "+" button that promotes the city into the full drawer.
 */

interface HoverInfo {
  x: number;
  y: number;
  content: string;
  city?: WeatherDataUnion;
}

export const useMapInteractions = (
  cities: WeatherDataUnion[],
  viewMode: ViewMode,
  dataType: DataType,
  selectedMonth?: number
) => {
  const [selectedCity, setSelectedCity] = useState<WeatherDataUnion | null>(
    null
  );
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const isMobileOrSmall = useIsMobileOrSmall();
  const homeLocation = useAppStore((state) => state.homeLocation);
  const homeCityData = useAppStore((state) => state.homeCityData);
  const temperatureUnit = useAppStore((state) => state.temperatureUnit);

  // Refs for stable callback identity — these change frequently but DeckGL
  // shouldn't see a new onClick / onHover on every state flip.
  const citiesRef = useRef(cities);
  citiesRef.current = cities;
  const isMobileRef = useRef(isMobileOrSmall);
  isMobileRef.current = isMobileOrSmall;
  const hoverInfoRef = useRef(hoverInfo);
  hoverInfoRef.current = hoverInfo;

  // Throttle hover updates to reduce re-renders from mouse movement
  const pendingHoverRef = useRef<HoverInfo | null>(null);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Apply pending hover update every 16ms (~60fps max)
  useEffect(() => {
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  const handleHover = useCallback(
    (info: PickingInfo) => {
      // On mobile, hover events come from synthetic touch sequences and would
      // overwrite the tap-set tooltip. The tooltip is tap-driven on mobile.
      if (isMobileRef.current) return;

      let newHoverInfo: HoverInfo | null = null;

      // Handle home location hover
      if (info.layer?.id === 'home-center') {
        if (homeCityData) {
          newHoverInfo = {
            x: info.x,
            y: info.y,
            content: getTooltipContent(
              [homeCityData],
              homeCityData.long!,
              homeCityData.lat!,
              dataType,
              selectedMonth,
              temperatureUnit
            )!,
          };
        } else if (homeLocation) {
          // Fallback: show just the city name if no data available
          newHoverInfo = {
            x: info.x,
            y: info.y,
            content: `${homeLocation.cityName}, ${homeLocation.country}`,
          };
        }
      } else if (viewMode === 'markers' && info.object) {
        const city = info.object as WeatherDataUnion;
        newHoverInfo = {
          x: info.x,
          y: info.y,
          content: getTooltipContent(
            [city],
            city.long!,
            city.lat!,
            dataType,
            selectedMonth,
            temperatureUnit
          )!,
        };
      } else if (viewMode === 'heatmap' && info.coordinate) {
        const [longitude, latitude] = info.coordinate;
        const content = getTooltipContent(
          citiesRef.current,
          longitude,
          latitude,
          dataType,
          selectedMonth,
          temperatureUnit
        );
        if (content) {
          newHoverInfo = {
            x: info.x,
            y: info.y,
            content,
          };
        }
      }

      // Store pending hover info
      pendingHoverRef.current = newHoverInfo;

      // Throttle state updates - only update every 16ms (60fps max)
      if (!throttleTimerRef.current) {
        throttleTimerRef.current = setTimeout(() => {
          setHoverInfo(pendingHoverRef.current);
          throttleTimerRef.current = null;
        }, 16);
      }
    },
    [
      viewMode,
      dataType,
      selectedMonth,
      homeCityData,
      homeLocation,
      temperatureUnit,
    ]
  );

  const handleClick = useCallback(
    (info: PickingInfo) => {
      // Home-center always opens the drawer directly on both mobile and desktop.
      if (info.layer?.id === 'home-center' && homeCityData) {
        setSelectedCity(homeCityData);
        return;
      }

      // Resolve which city (if any) was hit.
      let hitCity: WeatherDataUnion | null = null;
      if (viewMode === 'markers' && info.object) {
        hitCity = info.object as WeatherDataUnion;
      } else if (viewMode === 'heatmap' && info.coordinate) {
        const [longitude, latitude] = info.coordinate;
        hitCity =
          citiesRef.current.find(
            (c) =>
              c.lat !== null &&
              c.long !== null &&
              Math.abs(c.lat - latitude) < 0.5 &&
              Math.abs(c.long - longitude) < 0.5
          ) ?? null;
      }

      if (isMobileRef.current) {
        // Mobile: tap shows the tooltip with a "+" button instead of opening
        // the drawer. Tap-elsewhere or tap-same-marker dismisses it.
        if (!hitCity) {
          setHoverInfo(null);
          return;
        }
        if (hoverInfoRef.current?.city?.cityId === hitCity.cityId) {
          setHoverInfo(null);
          return;
        }
        setHoverInfo({
          x: info.x,
          y: info.y,
          content: getTooltipContent(
            [hitCity],
            hitCity.long!,
            hitCity.lat!,
            dataType,
            selectedMonth,
            temperatureUnit
          )!,
          city: hitCity,
        });
      } else {
        // Desktop: open the drawer directly.
        if (hitCity) {
          setSelectedCity(hitCity);
        }
      }
    },
    [viewMode, homeCityData, dataType, selectedMonth, temperatureUnit]
  );

  const handleClosePopup = useCallback(() => {
    setSelectedCity(null);
  }, []);

  // Promotes the city embedded in the current tooltip into the full drawer.
  const openHoveredCity = useCallback(() => {
    const city = hoverInfoRef.current?.city;
    if (city) {
      setHoverInfo(null);
      setSelectedCity(city);
    }
  }, []);

  return {
    selectedCity,
    hoverInfo,
    handleHover,
    handleClick,
    handleClosePopup,
    openHoveredCity,
  };
};
