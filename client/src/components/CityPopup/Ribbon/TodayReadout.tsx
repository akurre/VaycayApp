import type { RibbonHoverPayload } from '@/types/cityPopupTypes';
import {
  CITY1_PRIMARY_COLOR,
  CITY2_PRIMARY_COLOR,
  EM_DASH_PLACEHOLDER,
} from '@/const';
import { formatDateAsMonthDay } from '@/utils/dateFormatting/formatDateAsMonthDay';
import { DataType } from '@/types/mapTypes';
import type { TemperatureUnit } from '@/types/mapTypes';
import { formatTemperature } from '@/utils/tempFormatting/formatTemperature';
import { formatMm } from '@/utils/dataFormatting/formatMm';
import { formatRainyDays } from '@/utils/dataFormatting/formatRainyDays';
import { useAppStore } from '@/stores/useAppStore';

interface TodayReadoutProps {
  tab: DataType;
  c1Value: number | null;
  c2Value: number | null;
  subC1Value: number | null;
  subC2Value: number | null;
  hasComparison: boolean;
  selectedDate: string;
  hover: RibbonHoverPayload | null;
}

const formatHeadline = (
  tab: DataType,
  value: number | null,
  unit: TemperatureUnit
): string => {
  if (value === null) return EM_DASH_PLACEHOLDER;
  if (tab === DataType.Temperature) {
    return formatTemperature(value, unit) ?? EM_DASH_PLACEHOLDER;
  }
  if (tab === DataType.Sunshine) return `${Math.round(value)}% sun`;
  return formatMm(value);
};

const formatSub = (tab: DataType, value: number | null): string | null => {
  if (value === null) return null;
  if (tab === DataType.Precip) return formatRainyDays(value);
  return null;
};

const PREFIX_BY_TAB: Record<DataType, string> = {
  [DataType.Temperature]: 'On this day',
  [DataType.Sunshine]: 'In this month',
  [DataType.Precip]: 'In this week',
};

const VALUE_LABEL: Partial<Record<DataType, string>> = {
  [DataType.Sunshine]: 'daylight',
};

const TodayReadout = ({
  tab,
  c1Value,
  c2Value,
  subC1Value,
  subC2Value,
  hasComparison,
  selectedDate,
  hover,
}: TodayReadoutProps) => {
  const temperatureUnit = useAppStore((s) => s.temperatureUnit);

  const v1 = hover ? hover.v1 : formatHeadline(tab, c1Value, temperatureUnit);
  const v2 = hover ? hover.v2 : formatHeadline(tab, c2Value, temperatureUnit);
  const subV1 = hover ? (hover.subV1 ?? null) : formatSub(tab, subC1Value);
  const subV2 = hover ? (hover.subV2 ?? null) : formatSub(tab, subC2Value);

  const baseLabel = hover
    ? hover.label
    : `${PREFIX_BY_TAB[tab]} · ${formatDateAsMonthDay(selectedDate) || selectedDate}`;
  const valueLabel = VALUE_LABEL[tab];
  const fullLabel = valueLabel ? `${baseLabel} · ${valueLabel}` : baseLabel;

  return (
    <div className="text-right" aria-live="polite">
      <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--mantine-color-dimmed)]">
        {fullLabel}
      </div>
      <div className="flex gap-3.5 items-start justify-end mt-0.5">
        <div className="flex flex-col items-end">
          <span
            style={{ color: CITY1_PRIMARY_COLOR }}
            className="text-[24px] font-bold font-[Outfit] tabular-nums leading-none"
          >
            {v1 ?? EM_DASH_PLACEHOLDER}
          </span>
          {subV1 && (
            <span
              style={{ color: CITY1_PRIMARY_COLOR }}
              className="text-[10px] font-semibold font-[Outfit] tabular-nums leading-none mt-1 opacity-80"
            >
              {subV1}
            </span>
          )}
        </div>
        {hasComparison && (
          <div className="flex flex-col items-end">
            <span
              style={{ color: CITY2_PRIMARY_COLOR }}
              className="text-[18px] font-bold font-[Outfit] tabular-nums leading-none"
            >
              {v2 ?? EM_DASH_PLACEHOLDER}
            </span>
            {subV2 && (
              <span
                style={{ color: CITY2_PRIMARY_COLOR }}
                className="text-[10px] font-semibold font-[Outfit] tabular-nums leading-none mt-1 opacity-80"
              >
                {subV2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayReadout;
