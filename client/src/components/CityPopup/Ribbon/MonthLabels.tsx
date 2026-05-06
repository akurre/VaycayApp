import {
  MONTH_ABBREVIATIONS_SHORT,
  MONTH_DAY_OF_YEAR_STARTS,
  DAYS_IN_YEAR_NON_LEAP,
} from '@/const';

const MonthLabels = () => {
  return (
    <div className="relative h-3 mt-1">
      {MONTH_ABBREVIATIONS_SHORT.map((m, i) => (
        <span
          key={m}
          className="absolute text-[9px] uppercase tracking-[0.1em] tabular-nums text-[var(--mantine-color-dimmed)]"
          style={{
            left: `${(MONTH_DAY_OF_YEAR_STARTS[i] / (DAYS_IN_YEAR_NON_LEAP - 1)) * 100}%`,
          }}
        >
          {m}
        </span>
      ))}
    </div>
  );
};

export default MonthLabels;
