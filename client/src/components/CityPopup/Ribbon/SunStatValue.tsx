import { generateTheoreticalMaxSunshineData } from '@/utils/dataFormatting/generateTheoreticalMaxSunshineData';
import { formatSunshinePercentage } from '@/utils/dataFormatting/formatSunshinePercentage';

interface SunStatValueProps {
  averageMonthlyHours: number | null;
  latitude: number | null;
}

const PLACEHOLDER = '—';

const formatHours = (n: number | null): string =>
  n === null ? PLACEHOLDER : `${n.toFixed(0)}h`;

/**
 * Stacked "Sun / yr" value: average monthly sunshine hours on top, share of
 * the astronomical day-length ceiling below. Falls back to plain hours when
 * latitude or hours are missing.
 */
const SunStatValue = ({
  averageMonthlyHours,
  latitude,
}: SunStatValueProps) => {
  const hoursLabel = formatHours(averageMonthlyHours);

  if (latitude === null || averageMonthlyHours === null) {
    return <>{hoursLabel}</>;
  }

  const maxes = generateTheoreticalMaxSunshineData(latitude);
  const avgMaxMonthlyHours =
    maxes.reduce((acc, v) => acc + v, 0) / maxes.length;
  const pct = formatSunshinePercentage(averageMonthlyHours, avgMaxMonthlyHours);

  if (!pct) return <>{hoursLabel}</>;

  return (
    <div className="flex flex-col leading-tight">
      <span>{hoursLabel}</span>
      <span className="text-[10px] font-semibold opacity-80">{pct}</span>
    </div>
  );
};

export default SunStatValue;
