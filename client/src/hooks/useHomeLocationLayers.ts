import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import {
  HOME_PULSE_DURATION,
  HOME_RING_RADIUS_MIN,
  HOME_RING_RADIUS_MAX,
  HOME_RING_OPACITY_MIN,
  HOME_RING_OPACITY_MAX,
  HOME_RING_COLOR,
  HOME_CENTER_RADIUS_MIN,
  HOME_CENTER_RADIUS_MAX,
  HOME_LOCATION_BASE_RADIUS,
  HOME_RING_STROKE_WIDTH,
  HOME_DEFAULT_MARKER_COLOR,
} from '@/const';
import { DataType } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';
import type { ValidMarkerData } from '@/types/cityWeatherDataType';
import type { ValidSunshineMarkerData } from '@/utils/typeGuards';
import { getColorForCity } from '../utils/map/getColorForCity';

/**
 * Creates deck.gl layers for the home location with a pulsing ring effect.
 * Uses an external animation loop that updates layer props without triggering React re-renders.
 * The animation is handled by updating the layers' updateTriggers, which DeckGL monitors.
 *
 * To customize the animation, edit these constants in const.ts:
 * - HOME_PULSE_DURATION: Animation cycle duration (ms)
 * - HOME_RING_RADIUS_MIN/MAX: Ring size range (px)
 * - HOME_RING_OPACITY_MIN/MAX: Ring opacity range (0-255)
 * - HOME_RING_COLOR: Ring color RGB
 */
export function useHomeLocationLayers(dataType: DataType, selectedMonth: number) {
  // Separate selectors per Zustand documentation
  const homeLocation = useAppStore((state) => state.homeLocation);
  const homeCityData = useAppStore((state) => state.homeCityData);

  // Track animation time externally - no state updates during animation
  const animationTimeRef = useRef(0);
  const [animationTick, setAnimationTick] = useState(0);
  const updateCountRef = useRef(0);

  // Throttled update: only trigger React re-render ~15 times per second instead of 60
  const scheduleUpdate = useCallback(() => {
    updateCountRef.current++;
    // Update every 4th frame (~15fps instead of 60fps)
    if (updateCountRef.current % 4 === 0) {
      setAnimationTick((n) => n + 1);
    }
  }, []);

  // Animation loop that updates time reference without triggering re-renders on every frame
  useEffect(() => {
    if (!homeLocation) return;

    let frameId: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      // Store time in ref to avoid state updates
      animationTimeRef.current = (elapsed % HOME_PULSE_DURATION) / HOME_PULSE_DURATION;

      scheduleUpdate();
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [homeLocation, scheduleUpdate]);

  return useMemo(() => {
    if (!homeLocation) return [];

    // Compute the marker color directly from home city data using shared utility
    // Only use getColorForCity if we have valid data with non-null coordinates
    let markerColor = HOME_DEFAULT_MARKER_COLOR;
    if (homeCityData && homeCityData.lat !== null && homeCityData.long !== null) {
      // Type guard: check if data type matches and has required fields
      if (dataType === DataType.Temperature && 'avgTemperature' in homeCityData && homeCityData.avgTemperature !== null) {
        markerColor = getColorForCity(homeCityData as ValidMarkerData, dataType, selectedMonth);
      } else if (dataType === DataType.Sunshine && 'jan' in homeCityData) {
        markerColor = getColorForCity(homeCityData as ValidSunshineMarkerData, dataType, selectedMonth);
      }
    }

    // Calculate pulse values based on animation time (0 to 1, looping)
    const pulsePhase = animationTimeRef.current * Math.PI * 2;
    const pulseValue = Math.abs(Math.sin(pulsePhase));
    const ringRadius = HOME_RING_RADIUS_MIN + pulseValue * (HOME_RING_RADIUS_MAX - HOME_RING_RADIUS_MIN);
    const ringOpacity = HOME_RING_OPACITY_MIN + pulseValue * (HOME_RING_OPACITY_MAX - HOME_RING_OPACITY_MIN);

    return [
      // Pulsing ring (render first so it appears behind the center dot)
      new ScatterplotLayer({
        id: 'home-ring',
        data: [homeLocation],
        getPosition: (d) => [d.coordinates.long, d.coordinates.lat],
        getFillColor: [0, 0, 0, 0], // Transparent fill
        getLineColor: [...HOME_RING_COLOR, ringOpacity],
        getRadius: HOME_LOCATION_BASE_RADIUS,
        radiusMinPixels: ringRadius,
        radiusMaxPixels: ringRadius + 5,
        lineWidthMinPixels: HOME_RING_STROKE_WIDTH,
        stroked: true,
        filled: false,
        pickable: false,
        visible: true,
      }),
      // Solid center dot with normal marker color
      new ScatterplotLayer({
        id: 'home-center',
        data: [homeLocation],
        getPosition: (d) => [d.coordinates.long, d.coordinates.lat],
        getFillColor: markerColor,
        getRadius: HOME_LOCATION_BASE_RADIUS,
        radiusMinPixels: HOME_CENTER_RADIUS_MIN,
        radiusMaxPixels: HOME_CENTER_RADIUS_MAX,
        pickable: true,
        visible: true,
      }),
    ];
  }, [homeLocation, homeCityData, dataType, selectedMonth, animationTick]);
}
