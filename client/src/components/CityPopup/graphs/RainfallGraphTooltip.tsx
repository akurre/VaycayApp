import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';
import { weekRangeLabel } from '@/utils/dateFormatting/weekRangeLabel';
import { formatPrecipitation } from '@/utils/dataFormatting/formatPrecipitation';
import type { TemperatureUnit } from '@/types/mapTypes';

interface TooltipPayloadEntry {
  dataKey?: string | number;
  value?: unknown;
  color?: string;
}

interface RainfallGraphTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipPayloadEntry>;
  label?: string | number;
  hasMainData: boolean;
  hasCompData: boolean;
  temperatureUnit: TemperatureUnit;
}

interface TooltipItem {
  cityRole: 'main' | 'comparison';
  color: string;
  formatted: string;
}

const RainfallGraphTooltip = ({
  active,
  payload,
  label,
  hasMainData,
  hasCompData,
  temperatureUnit,
}: RainfallGraphTooltipProps) => {
  const formatValue = (v: unknown): string =>
    typeof v === 'number' ? formatPrecipitation(v, temperatureUnit) : String(v);
  if (!active || !payload || payload.length === 0) return null;

  const items: TooltipItem[] = [];
  for (const p of payload) {
    if (p.value === null || p.value === undefined) continue;
    const key = String(p.dataKey);
    const isComp = key === 'compTotalPrecip';
    if (isComp && !hasCompData) continue;
    if (!isComp && !hasMainData) continue;
    items.push({
      cityRole: isComp ? 'comparison' : 'main',
      color: p.color ?? (isComp ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR),
      formatted: formatValue(p.value),
    });
  }
  if (items.length === 0) return null;

  const main = items.find((i) => i.cityRole === 'main');
  const comp = items.find((i) => i.cityRole === 'comparison');
  const headerLabel = typeof label === 'number' ? weekRangeLabel(label) : null;

  return (
    <div className="rounded-md px-2.5 py-1.5 text-[11px] tabular-nums bg-[var(--mantine-color-default-hover)] border border-[var(--mantine-color-default-border)] shadow-md">
      {headerLabel && (
        <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--mantine-color-dimmed)] mb-1">
          {headerLabel}
        </div>
      )}
      <div className="flex items-baseline gap-3">
        {main && (
          <span className="font-semibold" style={{ color: main.color }}>
            {main.formatted}
          </span>
        )}
        {comp && (
          <span className="font-semibold" style={{ color: comp.color }}>
            {comp.formatted}
          </span>
        )}
      </div>
    </div>
  );
};

export default RainfallGraphTooltip;
