import DeckGL from '@deck.gl/react';
import { useRef, useEffect } from 'react';
import Map from 'react-map-gl/maplibre';
import { Transition, useComputedColorScheme } from '@mantine/core';
import useMapLayers from '../../hooks/useMapLayers';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import { useMapBounds } from '../../hooks/useMapBounds';
import { INITIAL_VIEW_STATE, MAP_STYLES } from '@/const';
import CityPopup from '../CityPopup/CityPopup';
import MapTooltip from './MapTooltip';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';
import { useAppStore } from '@/stores/useAppStore';
import { DataType } from '@/types/mapTypes';
import type { ViewMode, WeatherDataUnion } from '@/types/mapTypes';

interface WorldMapProps {
  cities: WeatherDataUnion[];
  viewMode: ViewMode;
  dataType: DataType;
  selectedMonth: number;
  selectedDate?: string;
  onBoundsChange?: (
    bounds: { minLat: number; maxLat: number; minLong: number; maxLong: number } | null,
    shouldUseBounds: boolean
  ) => void;
}

const WorldMap = ({
  cities,
  viewMode,
  dataType,
  selectedMonth,
  selectedDate,
  onBoundsChange,
}: WorldMapProps) => {
  const colorScheme = useComputedColorScheme('dark');
  const isLoadingWeather = useWeatherStore((state) => state.isLoadingWeather);
  const isLoadingSunshine = useSunshineStore((state) => state.isLoadingSunshine);
  const homeLocation = useAppStore((state) => state.homeLocation);
  const { viewState, onViewStateChange } = useMapBounds(INITIAL_VIEW_STATE, onBoundsChange);

  // Use the appropriate loading state based on data type
  const isLoading = dataType === DataType.Temperature ? isLoadingWeather : isLoadingSunshine;

  const layers = useMapLayers({
    cities,
    viewMode,
    dataType,
    selectedMonth,
    isLoadingWeather: isLoading,
    homeLocation,
  });

  const { selectedCity, hoverInfo, handleHover, handleClick, handleClosePopup } =
    useMapInteractions(cities, viewMode, dataType, selectedMonth, homeLocation);

  // Keep track of the last selected city for exit animation
  const lastSelectedCityRef = useRef<WeatherDataUnion | null>(null);

  useEffect(() => {
    if (selectedCity) {
      lastSelectedCityRef.current = selectedCity;
    }
  }, [selectedCity]);

  // Use the current or last selected city for rendering during transition
  const cityToRender = selectedCity || lastSelectedCityRef.current;

  return (
    <div className="relative h-full w-full">
      <DeckGL
        viewState={viewState}
        onViewStateChange={onViewStateChange}
        controller={{
          dragPan: true,
          dragRotate: false,
          scrollZoom: true,
          touchZoom: true,
          touchRotate: false,
          keyboard: true,
          doubleClickZoom: true,
        }}
        layers={layers}
        onHover={handleHover}
        onClick={handleClick}
        getTooltip={() => null}
        style={{ pointerEvents: 'auto' }}
      >
        <Map mapStyle={MAP_STYLES[colorScheme]} attributionControl={false} />
      </DeckGL>

      {hoverInfo && <MapTooltip x={hoverInfo.x} y={hoverInfo.y} content={hoverInfo.content} />}

      <Transition
        mounted={!!selectedCity}
        transition="fade-up"
        duration={500}
        timingFunction="ease"
      >
        {(transitionStyle) => (
          <div style={{ ...transitionStyle, position: 'fixed', inset: 0, pointerEvents: 'none' }}>
            {cityToRender && (
              <CityPopup
                city={cityToRender}
                onClose={handleClosePopup}
                selectedMonth={selectedMonth}
                selectedDate={selectedDate}
              />
            )}
          </div>
        )}
      </Transition>
    </div>
  );
};

export default WorldMap;
