import { Fragment, type ReactNode } from 'react';
import type { LineConfig, ChartDataPoint } from '@/types/chartTypes';
import { EM_DASH_PLACEHOLDER } from '@/const';

interface TooltipItem {
  dataKey: string;
  metricLabel: string | undefined;
  cityRole: 'main' | 'comparison';
  color: string;
  formatted: string;
}

interface TooltipPayloadEntry {
  dataKey?: string | number;
  value?: unknown;
  color?: string;
  payload?: unknown;
}

interface RechartsLineTooltipProps<T extends ChartDataPoint> {
  active?: boolean;
  payload?: ReadonlyArray<TooltipPayloadEntry>;
  label?: string | number;
  lines: LineConfig[];
  yTickFormatter?: (value: number) => string;
  formatTooltipLabel?: (raw: string | number) => string;
  renderExtras?: (row: T) => ReactNode;
}

const formatValue = (
  value: unknown,
  yTickFormatter: ((v: number) => string) | undefined
): string => {
  if (typeof value !== 'number') return String(value);
  const rounded = Number(value.toFixed(1));
  return yTickFormatter ? yTickFormatter(rounded) : rounded.toFixed(1);
};

const RechartsLineTooltip = <T extends ChartDataPoint>({
  active,
  payload,
  label,
  lines,
  yTickFormatter,
  formatTooltipLabel,
  renderExtras,
}: RechartsLineTooltipProps<T>) => {
  if (!active || !payload || payload.length === 0) return null;

  const seen = new Set<string>();
  const items: TooltipItem[] = [];
  for (const p of payload) {
    if (p.value === null || p.value === undefined) continue;
    const key = String(p.dataKey);
    if (seen.has(key)) continue;
    const cfg = lines.find((l) => l.dataKey === key);
    if (!cfg || cfg.strokeDasharray) continue;
    seen.add(key);
    items.push({
      dataKey: key,
      metricLabel: cfg.metricLabel,
      cityRole: cfg.cityRole ?? 'main',
      color: p.color ?? cfg.stroke,
      formatted: formatValue(p.value, yTickFormatter),
    });
  }
  if (items.length === 0) return null;

  const metricOrder: string[] = [];
  const grouped = new Map<
    string,
    { main?: TooltipItem; comparison?: TooltipItem }
  >();
  for (const it of items) {
    const key = it.metricLabel ?? '';
    if (!grouped.has(key)) {
      grouped.set(key, {});
      metricOrder.push(key);
    }
    const slot = grouped.get(key);
    if (!slot) continue;
    if (it.cityRole === 'comparison') slot.comparison = it;
    else slot.main = it;
  }

  const hasComparison = items.some((i) => i.cityRole === 'comparison');
  const hasLabels = items.some((i) => i.metricLabel);

  const cols = [
    hasLabels ? 'auto' : null,
    'auto',
    hasComparison ? 'auto' : null,
  ]
    .filter(Boolean)
    .join(' ');

  const headerLabel =
    label === undefined || label === null
      ? null
      : formatTooltipLabel
        ? formatTooltipLabel(label)
        : String(label);

  const firstPayload = payload[0]?.payload;
  const activeRow =
    firstPayload && typeof firstPayload === 'object'
      ? (firstPayload as T)
      : null;
  const extras = renderExtras && activeRow ? renderExtras(activeRow) : null;

  return (
    <div className="rounded-md px-2.5 py-1.5 text-[11px] tabular-nums bg-[var(--mantine-color-default-hover)] border border-[var(--mantine-color-default-border)] shadow-md">
      {headerLabel && (
        <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--mantine-color-dimmed)] mb-1">
          {headerLabel}
        </div>
      )}
      <div
        className="grid gap-x-3 gap-y-0.5 items-baseline"
        style={{ gridTemplateColumns: cols }}
      >
        {metricOrder.map((m) => {
          const slot = grouped.get(m);
          if (!slot) return null;
          return (
            <Fragment key={m || 'metric'}>
              {hasLabels && (
                <span className="text-[9px] uppercase tracking-[0.08em] text-[var(--mantine-color-dimmed)] font-semibold">
                  {m}
                </span>
              )}
              <span
                className="font-semibold"
                style={{ color: slot.main?.color }}
              >
                {slot.main ? slot.main.formatted : EM_DASH_PLACEHOLDER}
              </span>
              {hasComparison && (
                <span
                  className="font-semibold"
                  style={{ color: slot.comparison?.color }}
                >
                  {slot.comparison
                    ? slot.comparison.formatted
                    : EM_DASH_PLACEHOLDER}
                </span>
              )}
            </Fragment>
          );
        })}
      </div>
      {extras && <div className="mt-1.5">{extras}</div>}
    </div>
  );
};

export default RechartsLineTooltip;
