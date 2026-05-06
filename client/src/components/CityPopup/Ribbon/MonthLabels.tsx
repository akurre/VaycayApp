const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MonthLabels = () => {
  return (
    <div className="flex w-full justify-between px-1 text-[9px] uppercase tracking-[0.1em] text-[var(--mantine-color-dimmed)] tabular-nums">
      {MONTH_SHORT.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
};

export default MonthLabels;
