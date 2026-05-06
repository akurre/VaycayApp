const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Day-of-year of the FIRST of each month (non-leap)
const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

const MonthLabels = () => {
  return (
    <div className="relative h-3 mt-1">
      {MONTHS.map((m, i) => (
        <span
          key={m}
          className="absolute text-[9px] uppercase tracking-[0.1em] tabular-nums text-[var(--mantine-color-dimmed)]"
          style={{ left: `${(MONTH_STARTS[i] / 364) * 100}%` }}
        >
          {m}
        </span>
      ))}
    </div>
  );
};

export default MonthLabels;
