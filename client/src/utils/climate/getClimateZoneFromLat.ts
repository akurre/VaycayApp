/**
 * Compact latitude badge label for the city-popup ribbon
 * (e.g. "52°N", "33°S", "0°"). Magnitude is rounded to the nearest integer.
 */
export const getClimateZoneFromLat = (lat: number): string => {
  const rounded = Math.round(Math.abs(lat));
  if (rounded === 0) return '0°';
  return `${rounded}°${lat >= 0 ? 'N' : 'S'}`;
};
