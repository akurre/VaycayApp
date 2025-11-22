/**
 * Calculate day length (hours) for a given latitude and day of year
 * Uses simplified astronomical formula
 *
 * @param latitude - Latitude in degrees (-90 to 90)
 * @param dayOfYear - Day of year (1-365)
 * @returns Day length in hours
 */
export function calculateDayLength(latitude: number, dayOfYear: number): number {
  const latRad = (latitude * Math.PI) / 180;

  // Solar declination angle (simplified)
  // Peaks at +23.44° on summer solstice (day ~172) and -23.44° on winter solstice (day ~355)
  const declination = 23.44 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180));
  const declinationRad = (declination * Math.PI) / 180;

  // Hour angle calculation
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declinationRad);

  // Handle polar day/night
  if (cosHourAngle > 1) {
    return 0; // Polar night
  }
  if (cosHourAngle < -1) {
    return 24; // Polar day
  }

  // Day length in hours
  const hourAngle = Math.acos(cosHourAngle);
  return (2 * hourAngle * 12) / Math.PI;
}
