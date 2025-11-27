import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';

/**
 * Calculates the average annual rainfall from weekly weather data.
 * 
 * The backend aggregates multiple years of daily data into weekly totals.
 * Since totalPrecip represents the sum of precipitation across all years for that week,
 * we need to average it by the number of years of data to get a typical annual value.
 * 
 * We calculate this by: sum of (totalPrecip / daysWithData * 7) for all weeks
 * This gives us the average weekly precipitation, which when summed gives annual rainfall.
 */
export function calculateAverageRainfall(weeklyData: WeekDataPoint[]): number | null {
  const validWeeks = weeklyData.filter(
    (point) => point.totalPrecip !== null && point.daysWithData > 0
  );

  if (validWeeks.length === 0) return null;

  // Calculate average annual rainfall by normalizing each week's total by days of data
  // This accounts for the fact that totalPrecip may include multiple years of data
  const annualTotal = validWeeks.reduce((acc, week) => {
    // Normalize to average week: (totalPrecip / daysWithData) * 7
    const avgWeeklyPrecip = (week.totalPrecip! / week.daysWithData) * 7;
    return acc + avgWeeklyPrecip;
  }, 0);
  
  return annualTotal;
}
