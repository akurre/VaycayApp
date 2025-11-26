import { useMemo, useState, useEffect, useRef } from 'react';
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
import { perfMonitor } from '@/utils/performance/performanceMonitor';

/**
 * Creates deck.gl layers for the home location with a sonar ping effect.
 * The ring expands outward while fading from opaque to transparent, then resets.
 *
 * Performance optimization: Uses requestAnimationFrame at 60fps to update a ref,
 * but only triggers React re-renders at 15fps. This provides smooth 60fps animation
 * while reducing React reconciliation work by 75%.
 *
 * To customize the animation, edit these constants in const.ts:
 * - HOME_PULSE_DURATION: Animation cycle duration (ms)
 * - HOME_RING_RADIUS_MIN/MAX: Ring size range (px) - expands from MIN to MAX
 * - HOME_RING_OPACITY_MIN/MAX: Ring opacity range (0-255) - fades from MIN to MAX
 * - HOME_RING_COLOR: Ring color RGB
 */
export function useHomeLocationLayers(dataType: DataType, selectedMonth: number) {
  const homeLocation = useAppStore((state) => state.homeLocation);
  const homeCityData = useAppStore((state) => state.homeCityData);

  // Store animation time in a ref for 60fps updates without triggering React re-renders
  const animationTimeRef = useRef(0);

  // Trigger state for React re-renders - updated at 15fps instead of 60fps
  const [layerUpdateTrigger, setLayerUpdateTrigger] = useState(0);

  // Animation loop - runs at 60fps but only triggers React re-renders at 15fps
  // TEMPORARILY DISABLED TO DEBUG INFINITE LOOP
  // useEffect(() => {
  //   console.log('🔄 useHomeLocationLayers: Animation effect running', { homeLocation });
  //   if (!homeLocation) return;

  //   let frameId: number;
  //   const startTime = performance.now();
  //   let frameCount = 0;
  //   let updateCount = 0;

  //   const animate = (currentTime: number) => {
  //     perfMonitor.start('raf-home-animation');

  //     const elapsed = currentTime - startTime;
  //     // Update ref at 60fps - this doesn't trigger React re-renders
  //     animationTimeRef.current = (elapsed % HOME_PULSE_DURATION) / HOME_PULSE_DURATION;

  //     // Trigger React re-render every 4 frames (60fps / 4 = 15fps)
  //     // This reduces WorldMap re-renders by 75% while maintaining smooth animation
  //     frameCount++;
  //     if (frameCount >= 4) {
  //       updateCount++;
  //       if (updateCount % 30 === 0) {
  //         console.log('🔄 setLayerUpdateTrigger called', updateCount, 'times');
  //       }
  //       setLayerUpdateTrigger((prev) => prev + 1);
  //       frameCount = 0;
  //     }

  //     perfMonitor.end('raf-home-animation');

  //     frameId = requestAnimationFrame(animate);
  //   };

  //   frameId = requestAnimationFrame(animate);
  //   return () => {
  //     console.log('🛑 useHomeLocationLayers: Cleanup animation');
  //     cancelAnimationFrame(frameId);
  //   };
  // }, [homeLocation]);

  // Memoize marker color separately - only recalculate when data changes, not on every frame
  const markerColor = useMemo(() => {
    if (!homeCityData || homeCityData?.lat === null || homeCityData?.long === null) {
      return HOME_DEFAULT_MARKER_COLOR;
    }

    // Type guard: check if data type matches and has required fields
    // Important: verify the data has the correct shape for the current dataType
    if (dataType === DataType.Temperature) {
      if ('avgTemperature' in homeCityData && homeCityData.avgTemperature !== null) {
        return getColorForCity(homeCityData as ValidMarkerData, dataType, selectedMonth);
      }
    } else if (dataType === DataType.Sunshine) {
      if ('jan' in homeCityData) {
        return getColorForCity(homeCityData as ValidSunshineMarkerData, dataType, selectedMonth);
      }
    }

    // Return default color if data doesn't match current view type
    return HOME_DEFAULT_MARKER_COLOR;
  }, [homeCityData, dataType, selectedMonth]);

  // Memoize position data - only recreate when home location changes
  const positionData = useMemo(() => {
    if (!homeLocation) return [];
    return [homeLocation];
  }, [homeLocation]);

  return useMemo(() => {
    // Read current animation time from ref (updated at 60fps)
    // This useMemo only runs at 15fps due to layerUpdateTrigger dependency
    const animationTime = animationTimeRef.current;

    // Early return after reading ref to avoid conditional hook behavior
    if (!homeLocation) return [];

    // Sonar ping effect: linear expansion from small/opaque to large/transparent
    // animationTime goes from 0 to 1, creating a smooth outward pulse
    const ringRadius =
      HOME_RING_RADIUS_MIN + animationTime * (HOME_RING_RADIUS_MAX - HOME_RING_RADIUS_MIN);
    const ringOpacity =
      HOME_RING_OPACITY_MIN + animationTime * (HOME_RING_OPACITY_MAX - HOME_RING_OPACITY_MIN);

    return [
      // Pulsing ring (render first so it appears behind the center dot)
      new ScatterplotLayer({
        id: 'home-ring',
        data: positionData,
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
        data: positionData,
        getPosition: (d) => [d.coordinates.long, d.coordinates.lat],
        getFillColor: markerColor,
        getRadius: HOME_LOCATION_BASE_RADIUS,
        radiusMinPixels: HOME_CENTER_RADIUS_MIN,
        radiusMaxPixels: HOME_CENTER_RADIUS_MAX,
        pickable: true,
        visible: true,
      }),
    ];
  }, [homeLocation, markerColor, positionData, layerUpdateTrigger]);
}
