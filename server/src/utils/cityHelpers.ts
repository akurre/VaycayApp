import type { City, PrismaClient } from '@prisma/client';

/**
 * Title cases a city name (capitalizes first letter of each word)
 * e.g., "san francisco" -> "San Francisco", "new york" -> "New York"
 */
export function titleCaseCityName(cityName: string): string {
  return cityName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Finds the closest city by coordinates from a list of cities with the same name
 */
export function findClosestCity(
  cities: City[],
  targetLat: number,
  targetLong: number
): City | null {
  let closestCity: City | null = null;
  let minDistance = Infinity;

  for (const city of cities) {
    const distance = Math.sqrt(
      Math.pow(city.lat - targetLat, 2) + Math.pow(city.long - targetLong, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  }

  return closestCity;
}

/**
 * Finds a city by name and optionally by coordinates for precise matching
 */
export async function findCityByNameAndCoords(
  prisma: PrismaClient,
  cityName: string,
  lat?: number | null,
  long?: number | null
): Promise<City | null> {
  const normalizedName = titleCaseCityName(cityName);
  const cities = await prisma.city.findMany({
    where: { name: normalizedName },
  });

  if (cities.length === 0) {
    return null;
  }

  // If coordinates provided, find the closest match
  if (lat !== null && lat !== undefined && long !== null && long !== undefined) {
    return findClosestCity(cities, lat, long);
  }

  // Return first city if no coordinates provided
  return cities[0];
}

/**
 * Converts MMDD format to YYYY-MM-DD format
 */
export function formatMonthDayToDate(monthDay: string): string {
  const month = monthDay.slice(0, 2);
  const day = monthDay.slice(2);
  return `2020-${month}-${day}`;
}
