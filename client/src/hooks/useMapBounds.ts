import { useState, useCallback, useRef, useEffect } from 'react';
import type { MapViewState, ViewStateChangeParameters } from '@deck.gl/core';
import { WebMercatorViewport } from '@deck.gl/core';
import { ZOOM_THRESHOLD, DEBOUNCE_DELAY, BOUNDS_BUFFER_PERCENT } from '@/const';

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

  // get actual viewport dimensions from window
  // use innerWidth/innerHeight for full viewport coverage
  const width = window.innerWidth;
  const height = window.innerHeight;

  // create WebMercatorViewport with actual screen dimensions
  // this properly accounts for aspect ratio (typically 16:9 or wider)
  const viewport = new WebMercatorViewport({
    width,
    height,
    latitude,
    longitude,
    zoom,
  });

  // get bounds of the actual visible viewport
  // getBounds() returns [minLong, minLat, maxLong, maxLat]
  const [minLong, minLat, maxLong, maxLat] = viewport.getBounds();

  console.log('📍 calculateBounds:', {
    zoom,
    viewport: { width, height },
    center: { lat: latitude, long: longitude },
    bounds: { minLat, maxLat, minLong, maxLong },
    coverage: {
      latRange: (maxLat - minLat).toFixed(1),
      longRange: (maxLong - minLong).toFixed(1),
    },
  });

  // add buffer to include nearby cities outside visible area
  const latRange = maxLat - minLat;
  const longRange = maxLong - minLong;
  const bufferLat = latRange * BOUNDS_BUFFER_PERCENT;
  const bufferLong = longRange * BOUNDS_BUFFER_PERCENT;

  return {
    minLat: Math.max(-90, minLat - bufferLat),
    maxLat: Math.min(90, maxLat + bufferLat),
    minLong: Math.max(-180, minLong - bufferLong),
    maxLong: Math.min(180, maxLong + bufferLong),
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
      // Only update state if values actually changed (prevent unnecessary re-renders)
      setViewState((prev) => {
        if (
          prev.zoom === newViewState.zoom &&
          prev.latitude === newViewState.latitude &&
          prev.longitude === newViewState.longitude &&
          prev.bearing === newViewState.bearing &&
          prev.pitch === newViewState.pitch
        ) {
          return prev; // No change, return previous state to prevent re-render
        }
        return newViewState;
      });

      // clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // debounce bounds calculation and query trigger
      debounceTimerRef.current = setTimeout(() => {
        const useBounds = newViewState.zoom >= ZOOM_THRESHOLD;
        console.log('🔍 Zoom check:', {
          currentZoom: newViewState.zoom.toFixed(2),
          threshold: ZOOM_THRESHOLD,
          shouldUseBounds: useBounds,
        });
        setShouldUseBounds(useBounds);

        if (useBounds) {
          const newBounds = calculateBounds(newViewState);
          console.log('✅ Using bounds query with:', newBounds);
          setBounds(newBounds);
          onBoundsChange?.(newBounds, true);
        } else {
          console.log('🌍 Using global query (zoom < threshold)');
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
