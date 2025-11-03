import { useState, useCallback, useRef, useEffect } from 'react';
import type { MapViewState, ViewStateChangeParameters } from '@deck.gl/core';
import { ZOOM_THRESHOLD, DEBOUNCE_DELAY, BOUNDS_BUFFER_PERCENT } from '@/constants';

/**
 * hook to track map viewport bounds and zoom level for intelligent query switching.
 * automatically switches between global and bounds-based queries at zoom threshold.
 * debounces zoom/pan events to prevent excessive api calls.
 */

interface MapBounds {
  minLat: number;
  maxLat: number;
  minLong: number;
  maxLong: number;
}

interface UseMapBoundsReturn {
  viewState: MapViewState;
  bounds: MapBounds | null;
  shouldUseBounds: boolean;
  onViewStateChange: (params: ViewStateChangeParameters) => void;
}

// calculate geographic bounds from viewport with buffer
function calculateBounds(viewState: MapViewState): MapBounds {
  const { latitude, longitude, zoom } = viewState;

  // approximate degrees visible based on zoom level
  // zoom 0 = ~360° longitude, zoom increases by factor of 2
  const degreesLongitude = 360 / Math.pow(2, zoom);
  const degreesLatitude = 180 / Math.pow(2, zoom);

  // add buffer to include nearby areas (helps show cities in adjacent countries)
  const bufferLat = degreesLatitude * BOUNDS_BUFFER_PERCENT;
  const bufferLong = degreesLongitude * BOUNDS_BUFFER_PERCENT;

  return {
    minLat: Math.max(-90, Math.floor(latitude - degreesLatitude / 2 - bufferLat)),
    maxLat: Math.min(90, Math.ceil(latitude + degreesLatitude / 2 + bufferLat)),
    minLong: Math.max(-180, Math.floor(longitude - degreesLongitude / 2 - bufferLong)),
    maxLong: Math.min(180, Math.ceil(longitude + degreesLongitude / 2 + bufferLong)),
  };
}

export const useMapBounds = (
  initialViewState: MapViewState,
  onBoundsChange?: (bounds: MapBounds | null, shouldUseBounds: boolean) => void
): UseMapBoundsReturn => {
  const [viewState, setViewState] = useState<MapViewState>(initialViewState);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [shouldUseBounds, setShouldUseBounds] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onViewStateChange = useCallback(
    ({ viewState: newViewState }: { viewState: MapViewState }) => {
      setViewState(newViewState);

      // clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // debounce bounds calculation and query trigger
      debounceTimerRef.current = setTimeout(() => {
        const useBounds = newViewState.zoom >= ZOOM_THRESHOLD;
        setShouldUseBounds(useBounds);

        if (useBounds) {
          const newBounds = calculateBounds(newViewState);
          setBounds(newBounds);
          onBoundsChange?.(newBounds, true);
        } else {
          setBounds(null);
          onBoundsChange?.(null, false);
        }
      }, DEBOUNCE_DELAY);
    },
    [onBoundsChange]
  );

  // cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    viewState,
    bounds,
    shouldUseBounds,
    onViewStateChange,
  };
};
