import { POPULATION_MILLION_DIVISOR } from '@/const';

// Compact population suffix (" • 13.9M") for compare/search city rows. Returns
// an empty string when the value is missing so callers can concatenate without
// emitting a stray bullet.
export function formatCityPopulationSuffix(
  population: number | null | undefined
): string {
  if (!population) return '';
  return ` • ${(population / POPULATION_MILLION_DIVISOR).toFixed(1)}M`;
}
