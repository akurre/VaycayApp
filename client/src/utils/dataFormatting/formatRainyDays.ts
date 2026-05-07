// Format a rainy-day count as "1 rainy day" / "3 rainy days" for the popup
// readout. Returns null when the count is missing so the caller can omit the
// sub-line entirely.
export function formatRainyDays(
  days: number | null | undefined
): string | null {
  if (days === null || days === undefined) return null;
  if (!Number.isFinite(days) || days < 0) return null;
  const rounded = Math.round(days);
  return `${rounded} rainy day${rounded === 1 ? '' : 's'}`;
}
