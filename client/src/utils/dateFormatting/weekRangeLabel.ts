const MONTH_LABELS = [
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

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const dayOfYearToParts = (
  day: number
): { month: string; dayOfMonth: number } | null => {
  if (!Number.isFinite(day) || day < 1) return null;
  let remaining = day;
  for (let i = 0; i < 12; i++) {
    if (remaining <= DAYS_IN_MONTH[i]) {
      return { month: MONTH_LABELS[i], dayOfMonth: remaining };
    }
    remaining -= DAYS_IN_MONTH[i];
  }
  return { month: 'Dec', dayOfMonth: 31 };
};

export const weekRangeLabel = (week: number): string => {
  if (!Number.isFinite(week) || week < 1) return '';
  const startDay = (week - 1) * 7 + 1;
  const endDay = Math.min(startDay + 6, 365);
  const start = dayOfYearToParts(startDay);
  const end = dayOfYearToParts(endDay);
  if (!start || !end) return '';
  if (start.month === end.month && start.dayOfMonth === end.dayOfMonth) {
    return `${start.month} ${start.dayOfMonth}`;
  }
  if (start.month === end.month) {
    return `${start.month} ${start.dayOfMonth}–${end.dayOfMonth}`;
  }
  return `${start.month} ${start.dayOfMonth} – ${end.month} ${end.dayOfMonth}`;
};
