import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import { useComputedColorScheme } from '@mantine/core';
import useMapLayers from '../../hooks/useMapLayers';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import { useMapBounds } from '../../hooks/useMapBounds';
import { INITIAL_VIEW_STATE, MAP_STYLES } from '@/constants';
import CityPopup from '../CityPopup/CityPopup';
import MapTooltip from './MapTooltip';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';
import { useAppStore } from '@/stores/useAppStore';
import { DataType, ViewMode, WeatherDataUnion } from '@/types/mapTypes';

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
      >
        <Map mapStyle={MAP_STYLES[colorScheme]} attributionControl={false} />
      </DeckGL>

      {hoverInfo && <MapTooltip x={hoverInfo.x} y={hoverInfo.y} content={hoverInfo.content} />}

      <CityPopup
        city={selectedCity}
        onClose={handleClosePopup}
        selectedMonth={selectedMonth}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default WorldMap;
