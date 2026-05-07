/**
 * Format actual vs. theoretical-max sunshine hours as a percentage label
 * for the city-popup hover readout (e.g. "32% sun").
 *
 * Returns null when the percentage cannot be meaningfully computed: missing
 * actual hours, missing/zero theoretical max, or non-finite inputs.
 */
export function formatSunshinePercentage(
  actualHours: number | null | undefined,
  theoreticalMaxHours: number | null | undefined
): string | null {
  if (actualHours === null || actualHours === undefined) return null;
  if (theoreticalMaxHours === null || theoreticalMaxHours === undefined) {
    return null;
  }
  if (!Number.isFinite(actualHours) || !Number.isFinite(theoreticalMaxHours)) {
    return null;
  }
  if (theoreticalMaxHours <= 0) return null;

  const percent = Math.round((actualHours / theoreticalMaxHours) * 100);
  return `${percent}% sun`;
}
