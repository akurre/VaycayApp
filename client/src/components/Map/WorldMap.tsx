import DeckGL from '@deck.gl/react';
import { useRef, useEffect, useMemo, useState } from 'react';
import Map from 'react-map-gl/maplibre';
import { Transition, useComputedColorScheme, Loader } from '@mantine/core';
import useMapLayers from '../../hooks/useMapLayers';
import { useMapInteractions } from '../../hooks/useMapInteractions';
import { useMapBounds } from '../../hooks/useMapBounds';
import { useHomeCityData } from '../../hooks/useHomeCityData';
import { useHomeLocationLayers } from '../../hooks/useHomeLocationLayers';
import { useLoadingTier } from '../../hooks/useLoadingTier';
import { useBreatheAnimation } from '../../hooks/useBreatheAnimation';
import {
  INITIAL_VIEW_STATE,
  LOADER_DELAY_MS,
  MAP_FADE_IN_DELAY_MS,
  MAP_LOADED_OPACITY,
  MAP_LOADING_OPACITY,
  MAP_MAX_DEVICE_PIXEL_RATIO,
  MAP_SCROLL_ZOOM_SPEED,
  MAP_STYLES,
} from '@/const';
import CityPopup from '../CityPopup/CityPopup';
import MobileCityDrawer from '../CityPopup/Mobile/MobileCityDrawer';
import useIsMobileOrSmall from '@/hooks/useIsMobileOrSmall';
import MapTooltip from './MapTooltip';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';
import { useAppStore } from '@/stores/useAppStore';
import { DataType } from '@/types/mapTypes';
import type { ViewMode, WeatherDataUnion } from '@/types/mapTypes';
import { perfMonitor } from '@/utils/performance/performanceMonitor';
import ComponentErrorBoundary from '../ErrorBoundary/ComponentErrorBoundary';

interface WorldMapProps {
  cities: WeatherDataUnion[];
  viewMode: ViewMode;
  dataType: DataType;
  selectedMonth: number;
  selectedDate?: string;
  debouncedDate?: string;
  onBoundsChange?: (
    bounds: {
      minLat: number;
      maxLat: number;
      minLong: number;
      maxLong: number;
    } | null,
    shouldUseBounds: boolean
  ) => void;
}

const WorldMap = ({
  cities,
  viewMode,
  dataType,
  selectedMonth,
  selectedDate,
  debouncedDate,
  onBoundsChange,
}: WorldMapProps) => {
  // Track initial map load time
  const hasTrackedInitialLoad = useRef(false);

  // Track basemap loading state
  const [isBasemapLoaded, setIsBasemapLoaded] = useState(false);

  // Track whether to show loader (delayed to avoid flash for quick loads)
  const [showLoader, setShowLoader] = useState(false);

  // Track map content opacity for smooth transitions
  const [mapOpacity, setMapOpacity] = useState(1);

  const colorScheme = useComputedColorScheme('dark');
  const isMobileOrSmall = useIsMobileOrSmall();
  const isLoadingWeather = useWeatherStore((state) => state.isLoadingWeather);
  const isLoadingSunshine = useSunshineStore(
    (state) => state.isLoadingSunshine
  );
  const isGesturing = useAppStore((state) => state.isGesturing);
  const { viewState, onViewStateChange } = useMapBounds(
    INITIAL_VIEW_STATE,
    onBoundsChange
  );

  // Fetch and store home city data
  useHomeCityData(dataType, selectedDate);

  // Use the appropriate loading state based on data type
  const isLoading =
    dataType === DataType.Temperature ? isLoadingWeather : isLoadingSunshine;

  // Determine loading tier (Tier 1 = data change, Tier 2 = pan/zoom)
  const { tier } = useLoadingTier({
    isLoading,
    debouncedDate,
    selectedMonth,
    dataType,
    isBasemapLoaded,
  });

  // Breathe animation + ghost dots only fire during tier2 AND only while
  // the user isn't actively gesturing. The MapDataLoader spinner is the
  // single source of "loading is happening" feedback during a pan; both
  // the breathe pulse and the placeholder ghost-dot grid are visual noise
  // that competes with the (gated) real markers and adds GPU work.
  const showLoadingDecorations = tier === 'tier2' && !isGesturing;

  const { opacity: breatheOpacity } = useBreatheAnimation({
    isActive: showLoadingDecorations,
  });

  // Get city layers (heatmap + markers) - these are expensive to recreate
  const cityLayers = useMapLayers({
    cities,
    viewMode,
    dataType,
    selectedMonth,
    breatheOpacity: showLoadingDecorations ? breatheOpacity : undefined,
    isGhostDotsActive: showLoadingDecorations,
    viewState,
  });

  // Get home location layers separately - these update 15fps for animation
  const homeLocationLayers = useHomeLocationLayers(dataType, selectedMonth);

  // Merge layers at component level - when home animates, only this merge reruns, not city layer creation
  // Only show layers after basemap is loaded to prevent markers appearing before map tiles
  const layers = useMemo(
    () => (isBasemapLoaded ? [...cityLayers, ...homeLocationLayers] : []),
    [cityLayers, homeLocationLayers, isBasemapLoaded]
  );

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

  const {
    selectedCity,
    hoverInfo,
    handleHover,
    handleClick,
    handleClosePopup,
  } = useMapInteractions(cities, viewMode, dataType, selectedMonth);

  // Memoize controller config to prevent DeckGL from seeing it as a new object on every render
  const controller = useMemo(
    () => ({
      dragPan: true,
      dragRotate: false,
      scrollZoom: { speed: MAP_SCROLL_ZOOM_SPEED },
      touchZoom: true,
      touchRotate: false,
      keyboard: true,
      doubleClickZoom: true,
    }),
    [] // Empty deps - controller config never changes
  );

  // Memoize DeckGL style to prevent new object reference on every render
  const deckGLStyle = useMemo(() => ({ pointerEvents: 'auto' as const }), []);

  // Custom cursor handler - show pointer when hovering over markers in marker view
  const getCursor = useMemo(
    () =>
      ({
        isHovering,
        isDragging,
      }: {
        isHovering: boolean;
        isDragging: boolean;
      }) => {
        // In marker view, show pointer cursor when hovering over a marker
        if (viewMode === 'markers' && isHovering) {
          return 'pointer';
        }
        // Show grabbing cursor while actively dragging
        if (isDragging) {
          return 'grabbing';
        }
        // Default grab cursor for map dragging
        return 'grab';
      },
    [viewMode]
  );

  // Keep track of the last selected city for exit animation
  const lastSelectedCityRef = useRef<WeatherDataUnion | null>(null);

  useEffect(() => {
    if (selectedCity) {
      lastSelectedCityRef.current = selectedCity;
    }
  }, [selectedCity]);

  // Delayed loader effect - Tier 1 shows overlay, Tier 2 uses breathe animation (no overlay)
  useEffect(() => {
    if (tier === 'tier1') {
      // Tier 1: Show blocking overlay (date change, initial load)
      setMapOpacity(MAP_LOADING_OPACITY);
      const timer = setTimeout(() => setShowLoader(true), LOADER_DELAY_MS);
      return () => clearTimeout(timer);
    } else {
      // Tier 2 or no loading: no overlay, full opacity
      setShowLoader(false);
      const fadeTimer = setTimeout(
        () => setMapOpacity(MAP_LOADED_OPACITY),
        MAP_FADE_IN_DELAY_MS
      );
      return () => clearTimeout(fadeTimer);
    }
  }, [tier]);

  // Use the current or last selected city for rendering during transition
  const cityToRender = selectedCity || lastSelectedCityRef.current;

  return (
    <div className="relative h-full w-full">
      <div
        style={{
          opacity: mapOpacity,
          transition: 'opacity 500ms ease-in-out',
        }}
      >
        <DeckGL
          viewState={viewState}
          onViewStateChange={onViewStateChange}
          controller={controller}
          layers={layers}
          onHover={handleHover}
          onClick={handleClick}
          getTooltip={() => null}
          getCursor={getCursor}
          style={deckGLStyle}
          useDevicePixels={Math.min(
            window.devicePixelRatio,
            MAP_MAX_DEVICE_PIXEL_RATIO
          )}
        >
          <Map
            mapStyle={MAP_STYLES[colorScheme]}
            attributionControl={false}
            reuseMaps
            onLoad={() => setIsBasemapLoaded(true)}
          />
        </DeckGL>
      </div>

      {/* Loading indicator with smooth transitions */}
      <Transition
        mounted={showLoader}
        transition="fade"
        duration={400}
        timingFunction="ease"
      >
        {(transitionStyle) => (
          <div
            style={transitionStyle}
            className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-10 pointer-events-none"
          >
            <Loader size="lg" />
          </div>
        )}
      </Transition>

      {hoverInfo && (
        <MapTooltip
          x={hoverInfo.x}
          y={hoverInfo.y}
          content={hoverInfo.content}
        />
      )}

      <Transition
        mounted={!!selectedCity}
        transition="fade-up"
        duration={500}
        timingFunction="ease"
      >
        {(transitionStyle) => (
          <div
            style={{
              ...transitionStyle,
              position: 'fixed',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            {cityToRender &&
              (isMobileOrSmall ? (
                <ComponentErrorBoundary componentName="MobileCityDrawer">
                  <MobileCityDrawer
                    city={cityToRender}
                    onClose={handleClosePopup}
                    selectedMonth={selectedMonth}
                    selectedDate={selectedDate}
                    dataType={dataType}
                  />
                </ComponentErrorBoundary>
              ) : (
                <ComponentErrorBoundary componentName="CityPopup">
                  <CityPopup
                    city={cityToRender}
                    onClose={handleClosePopup}
                    selectedMonth={selectedMonth}
                    selectedDate={selectedDate}
                    dataType={dataType}
                  />
                </ComponentErrorBoundary>
              ))}
          </div>
        )}
      </Transition>
    </div>
  );
};

export default WorldMap;
