import type { RibbonStat } from '@/types/cityPopupTypes';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface MobileDetailsListProps {
  stats: ReadonlyArray<RibbonStat>;
  hasComparison: boolean;
}

const MobileDetailsList = ({ stats, hasComparison }: MobileDetailsListProps) => {
  return (
    <div
      data-testid="mobile-details-list"
      className="flex flex-col gap-2 overflow-y-auto"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="px-3 py-2.5 rounded bg-[var(--mantine-color-default-hover)] border border-[var(--mantine-color-default-border)]"
        >
          <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--mantine-color-dimmed)] font-mono">
            {s.label}
          </div>
          <div
            className="text-[18px] font-bold tabular-nums mt-0.5"
            style={{ color: CITY1_PRIMARY_COLOR }}
          >
            {s.v1}
          </div>
          {hasComparison && (
            <div
              className="text-[14px] font-semibold tabular-nums mt-0.5"
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

export default MobileDetailsList;
