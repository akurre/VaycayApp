import { useRef } from 'react';

// Global Set to track cities that have been viewed
// This persists across component unmounts/remounts
const seenCitiesSet = new Set<string>();

/**
 * Hook to track which cities have been viewed during the session.
 * Returns whether a given cityKey is new (never seen before).
 *
 * This persists across component unmounts, so switching between
 * cached cities won't trigger the initial animation.
 */
export function useSeenCities(cityKey: string): boolean {
  const hasMarkedRef = useRef(false);

  // Check if this is a new city
  const isNewCity = !seenCitiesSet.has(cityKey);

  // Mark as seen on mount (only once per instance)
  if (!hasMarkedRef.current && isNewCity) {
    seenCitiesSet.add(cityKey);
    hasMarkedRef.current = true;
  }

  return isNewCity;
}
