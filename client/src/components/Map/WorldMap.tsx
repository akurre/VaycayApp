import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import { WeatherData } from '../../types/cityWeatherDataType';
import useMapLayers from '../../hooks/useMapLayers';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import { useMapBounds } from '../../hooks/useMapBounds';
import { INITIAL_VIEW_STATE, MAP_STYLES } from '@/constants';
import CityPopup from './CityPopup';
import MapTooltip from './MapTooltip';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useAppStore } from '@/stores/useAppStore';
import { ViewMode } from '@/types/mapTypes';

interface WorldMapProps {
  cities: WeatherData[];
  viewMode: ViewMode;
  onBoundsChange?: (
    bounds: { minLat: number; maxLat: number; minLong: number; maxLong: number } | null,
    shouldUseBounds: boolean
  ) => void;
}

function WorldMap({ cities, viewMode, onBoundsChange }: WorldMapProps) {
  const theme = useAppStore((state) => state.theme);
  const isLoadingWeather = useWeatherStore((state) => state.isLoadingWeather);
  const { viewState, onViewStateChange } = useMapBounds(INITIAL_VIEW_STATE, onBoundsChange);
  const layers = useMapLayers({ cities, viewMode, isLoadingWeather });
  const { selectedCity, hoverInfo, handleHover, handleClick, handleClosePopup } =
    useMapInteractions(cities, viewMode);

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
        <Map mapStyle={MAP_STYLES[theme]} attributionControl={false} />
      </DeckGL>

      {hoverInfo && <MapTooltip x={hoverInfo.x} y={hoverInfo.y} content={hoverInfo.content} />}

      <CityPopup city={selectedCity} onClose={handleClosePopup} />
    </div>
  );
}

export default WorldMap;
