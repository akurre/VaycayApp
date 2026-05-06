import type { RibbonStat } from '@/types/cityPopupTypes';
import {
  CITY1_PRIMARY_COLOR,
  CITY2_PRIMARY_COLOR,
  RIBBON_STAT_RAIL_WIDTH_PX,
} from '@/const';

interface StatStackProps {
  stats: ReadonlyArray<RibbonStat>;
  hasComparison: boolean;
}

const StatStack = ({ stats, hasComparison }: StatStackProps) => {
  return (
    <div
      data-testid="stat-rail"
      className="flex flex-col gap-1.5 shrink-0 self-stretch"
      style={{ width: RIBBON_STAT_RAIL_WIDTH_PX }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex-1 px-2.5 py-2 rounded bg-[var(--mantine-color-default-hover)] border border-[var(--mantine-color-default-border)] flex flex-col justify-center"
        >
          <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--mantine-color-dimmed)]">
            {s.label}
          </div>
          <div
            className="text-[13px] font-bold tabular-nums"
            style={{ color: CITY1_PRIMARY_COLOR }}
          >
            {s.v1}
          </div>
          {hasComparison && (
            <div
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: CITY2_PRIMARY_COLOR }}
            >
              {s.v2}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatStack;
