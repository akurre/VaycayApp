import DeckGL from '@deck.gl/react';
import { useRef, useEffect, useMemo } from 'react';
import Map from 'react-map-gl/maplibre';
import { Transition, useComputedColorScheme } from '@mantine/core';
import useMapLayers from '../../hooks/useMapLayers';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import { useMapBounds } from '../../hooks/useMapBounds';
import { useHomeCityData } from '../../hooks/useHomeCityData';
import { useHomeLocationLayers } from '../../hooks/useHomeLocationLayers';
import { INITIAL_VIEW_STATE, MAP_STYLES } from '@/const';
import CityPopup from '../CityPopup/CityPopup';
import MapTooltip from './MapTooltip';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';
import { DataType } from '@/types/mapTypes';
import type { ViewMode, WeatherDataUnion } from '@/types/mapTypes';
import { perfMonitor } from '@/utils/performance/performanceMonitor';

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
  const { viewState, onViewStateChange } = useMapBounds(INITIAL_VIEW_STATE, onBoundsChange);

  // Fetch and store home city data
  useHomeCityData(dataType, selectedDate);

  // Use the appropriate loading state based on data type
  const isLoading = dataType === DataType.Temperature ? isLoadingWeather : isLoadingSunshine;

  // Get city layers (heatmap + markers) - these are expensive to recreate
  const cityLayers = useMapLayers({
    cities,
    viewMode,
    dataType,
    selectedMonth,
    isLoadingWeather: isLoading,
  });

  // Get home location layers separately - these update 15fps for animation
  const homeLocationLayers = useHomeLocationLayers(dataType, selectedMonth);

  // Merge layers at component level - when home animates, only this merge reruns, not city layer creation
  const layers = useMemo(
    () => [...cityLayers, ...homeLocationLayers],
    [cityLayers, homeLocationLayers]
  );

  // Track initial map load time
  const hasTrackedInitialLoad = useRef(false);
  useEffect(() => {
    if (!hasTrackedInitialLoad.current && cityLayers.length > 0) {
      hasTrackedInitialLoad.current = true;
      perfMonitor.start('map-initial-load');
      // Use requestAnimationFrame to measure when the map is actually rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          perfMonitor.end('map-initial-load');
        });
      });
    }
  }, [cityLayers]);

  const { selectedCity, hoverInfo, handleHover, handleClick, handleClosePopup } =
    useMapInteractions(cities, viewMode, dataType, selectedMonth);

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
                key={`${cityToRender.city}-${cityToRender.lat}-${cityToRender.long}`}
                city={cityToRender}
                onClose={handleClosePopup}
                selectedMonth={selectedMonth}
                selectedDate={selectedDate}
                dataType={dataType}
              />
            )}
          </div>
        )}
      </Transition>
    </div>
  );
};

export default WorldMap;
