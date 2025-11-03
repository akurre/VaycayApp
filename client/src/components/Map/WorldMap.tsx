import DeckGL from '@deck.gl/react';
import Map from 'react-map-gl/maplibre';
import type { MapViewState } from '@deck.gl/core';
import { WeatherData } from '../../types/cityWeatherDataType';
import { useMapLayers } from '../../hooks/useMapLayers';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import { useMapBounds } from '../../hooks/useMapBounds';
import CityPopup from './CityPopup';
import MapTooltip from './MapTooltip';
import 'maplibre-gl/dist/maplibre-gl.css';

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
  pitch: 0,
  bearing: 0,
};

export type ViewMode = 'heatmap' | 'markers';

interface WorldMapProps {
  cities: WeatherData[];
  viewMode: ViewMode;
  onBoundsChange?: (
    bounds: { minLat: number; maxLat: number; minLong: number; maxLong: number } | null,
    shouldUseBounds: boolean
  ) => void;
}

function WorldMap({ cities, viewMode, onBoundsChange }: WorldMapProps) {
  const { viewState, onViewStateChange } = useMapBounds(INITIAL_VIEW_STATE, onBoundsChange);
  const layers = useMapLayers(cities, viewMode);
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
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>

      {hoverInfo && <MapTooltip x={hoverInfo.x} y={hoverInfo.y} content={hoverInfo.content} />}

      <CityPopup city={selectedCity} onClose={handleClosePopup} />
    </div>
  );
}

export default WorldMap;
