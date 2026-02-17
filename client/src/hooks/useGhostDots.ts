import { useMemo, useRef, useEffect } from 'react';
import type { MapViewState } from '@deck.gl/core';
import { WebMercatorViewport } from '@deck.gl/core';
import type { WeatherDataUnion } from '@/types/mapTypes';
import { DataType } from '@/types/mapTypes';
import {
  TEMPERATURE_LOADING_COLOR,
  SUNSHINE_LOADING_COLOR,
  GHOST_DOT_MAX_COUNT,
  GHOST_DOT_GRID_SPACING_DEG,
  GHOST_DOT_EXCLUSION_RADIUS_DEG,
  GHOST_DOT_ALPHA,
} from '@/const';

export interface GhostDot {
  lat: number;
  long: number;
  color: [number, number, number, number];
}

interface UseGhostDotsProps {
  realCities: WeatherDataUnion[];
  viewState: MapViewState;
  isActive: boolean;
  dataType: DataType;
}

export function useGhostDots({
  realCities,
  viewState,
  isActive,
  dataType,
}: UseGhostDotsProps): GhostDot[] {
  const snapshotRef = useRef(viewState);
  const wasActiveRef = useRef(false);

  // Snapshot the viewport when loading becomes active (moved to useEffect)
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      snapshotRef.current = viewState;
    }
    wasActiveRef.current = isActive;
  }, [isActive, viewState]);

  // Intentionally excludes viewState from deps — we snapshot it once when isActive becomes true
  // and hold that snapshot for the duration of the loading session (see useEffect above)
  return useMemo(() => {
    if (!isActive) {
      return [];
    }

    const vs = snapshotRef.current;
    const viewport = new WebMercatorViewport({
      width: window.innerWidth,
      height: window.innerHeight,
      latitude: vs.latitude,
      longitude: vs.longitude,
      zoom: vs.zoom,
    });

    const [minLong, minLat, maxLong, maxLat] = viewport.getBounds();

    const baseColor =
      dataType === DataType.Temperature
        ? TEMPERATURE_LOADING_COLOR
        : SUNSHINE_LOADING_COLOR;
    const ghostColor: [number, number, number, number] = [
      baseColor[0],
      baseColor[1],
      baseColor[2],
      GHOST_DOT_ALPHA,
    ];

    const candidates: GhostDot[] = [];

    for (let lat = minLat; lat <= maxLat; lat += GHOST_DOT_GRID_SPACING_DEG) {
      for (
        let long = minLong;
        long <= maxLong;
        long += GHOST_DOT_GRID_SPACING_DEG
      ) {
        // Deterministic jitter based on position — avoids flickering when ghost dots recompute
        // with same viewport (Math.random would produce different dots each time)
        const jitterLat = ((lat * 7 + long * 13) % 100) / 100 - 0.5;
        const jitterLong = ((lat * 11 + long * 3) % 100) / 100 - 0.5;
        const jitteredLat = lat + jitterLat * 0.5;
        const jitteredLong = long + jitterLong * 0.5;

        const tooCloseToRealCity = realCities.some((city) => {
          if (city.lat == null || city.long == null) return false;
          const latDiff = Math.abs(city.lat - jitteredLat);
          const longDiff = Math.abs(city.long - jitteredLong);
          return (
            latDiff < GHOST_DOT_EXCLUSION_RADIUS_DEG &&
            longDiff < GHOST_DOT_EXCLUSION_RADIUS_DEG
          );
        });

        if (!tooCloseToRealCity) {
          candidates.push({
            lat: jitteredLat,
            long: jitteredLong,
            color: ghostColor,
          });
        }

        if (candidates.length >= GHOST_DOT_MAX_COUNT) {
          break;
        }
      }
      if (candidates.length >= GHOST_DOT_MAX_COUNT) {
        break;
      }
    }

    return candidates.slice(0, GHOST_DOT_MAX_COUNT);
  }, [isActive, realCities, dataType]);
}
