import { useMemo } from 'react';
import { generateTheoreticalMaxSunshineData } from '@/utils/dataFormatting/generateTheoreticalMaxSunshineData';
import { formatSunshinePercentage } from '@/utils/dataFormatting/formatSunshinePercentage';
import { formatHours } from '@/utils/dataFormatting/formatHours';

interface SunStatValueProps {
  averageMonthlyHours: number | null;
  latitude: number | null;
}

/**
 * Stacked "Sun / yr" value: average monthly sunshine hours on top, share of
 * the astronomical day-length ceiling below. Falls back to plain hours when
 * latitude or hours are missing.
 */
const SunStatValue = ({ averageMonthlyHours, latitude }: SunStatValueProps) => {
  const hoursLabel = formatHours(averageMonthlyHours, 0);

  const avgMaxMonthlyHours = useMemo(() => {
    if (latitude === null) return null;
    const maxes = generateTheoreticalMaxSunshineData(latitude);
    if (maxes.length === 0) return null;
    return maxes.reduce((acc, v) => acc + v, 0) / maxes.length;
  }, [latitude]);

  if (latitude === null || averageMonthlyHours === null) {
    return <>{hoursLabel}</>;
  }

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
