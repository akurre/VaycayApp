import NodeCache from 'node-cache';
import { CACHE_CONFIG } from '../const';

// cache for weather data queries with 1-hour TTL
const weatherCache = new NodeCache({
  stdTTL: CACHE_CONFIG.TTL,
  checkperiod: CACHE_CONFIG.CHECK_PERIOD,
});

/**
 * generic caching function for weather data queries
 * @param cacheKey unique key for this query
 * @param fetchFn function to execute if cache miss
 * @returns cached data or fresh data from fetchFn
 */
export async function getCachedWeatherData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const cached = weatherCache.get<T>(cacheKey);
  if (cached) {
    console.log(`✓ cache hit: ${cacheKey}`);
    return Promise.resolve(cached);
  }

  console.log(`✗ cache miss: ${cacheKey}`);
  const data = await fetchFn();
  weatherCache.set(cacheKey, data);
  return data;
}

/**
 * clear all cached weather data (useful for testing or manual refresh)
 */
export function clearWeatherCache(): void {
  weatherCache.flushAll();
  console.log('✓ weather cache cleared');
}

/**
 * get cache statistics
 */
export function getCacheStats() {
  return weatherCache.getStats();
}
