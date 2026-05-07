import {
  CALENDAR_DAYS,
  DAYS_IN_YEAR_NON_LEAP,
  MONTH_ABBREVIATIONS_SHORT,
} from '@/const';

const dayOfYearToParts = (
  day: number
): { month: string; dayOfMonth: number } | null => {
  if (!Number.isFinite(day) || day < 1) return null;
  let remaining = day;
  for (let i = 0; i < 12; i++) {
    if (remaining <= CALENDAR_DAYS[i]) {
      return {
        month: MONTH_ABBREVIATIONS_SHORT[i],
        dayOfMonth: remaining,
      };
    }
    remaining -= CALENDAR_DAYS[i];
  }
  return { month: 'Dec', dayOfMonth: 31 };
};

export const weekRangeLabel = (week: number): string => {
  if (!Number.isFinite(week) || week < 1) return '';
  const startDay = (week - 1) * 7 + 1;
  const endDay = Math.min(startDay + 6, DAYS_IN_YEAR_NON_LEAP);
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
