// formats distance for display, using miles for US/UK locales and km for others

import { KM_TO_MILES, MILES_LOCALES } from '@/const';

function shouldUseMiles(): boolean {
  const locale = navigator.language;
  return MILES_LOCALES.some((milesLocale) =>
    locale.startsWith(milesLocale.split('-')[0])
  );
}

export function formatDistance(distanceKm: number): string {
  const useMiles = shouldUseMiles();
  const distance = useMiles ? distanceKm * KM_TO_MILES : distanceKm;
  const unit = useMiles ? 'mi' : 'km';

  // for distances less than 10, show 1 decimal place
  // eslint-disable-next-line no-magic-numbers
  if (distance < 10) {
    return `${distance.toFixed(1)} ${unit}`;
  }

  // for distances 10 and above, show whole numbers with thousand separators
  return `${Math.round(distance).toLocaleString()} ${unit}`;
}

export default formatDistance;
