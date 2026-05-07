import { EM_DASH_PLACEHOLDER } from '@/const';

// Locale-aware integer population (e.g. "1,234,567"). Returns the em-dash
// placeholder when the value is missing so the stat rail stays aligned.
export function formatPopulation(pop: number | null | undefined): string {
  if (pop === null || pop === undefined) return EM_DASH_PLACEHOLDER;
  return pop.toLocaleString();
}
