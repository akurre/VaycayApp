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

export const weekStartLabel = (week: number): string => {
  if (!Number.isFinite(week) || week < 1) return '';
  let remaining = (week - 1) * 7 + 1;
  for (let i = 0; i < 12; i++) {
    if (remaining <= DAYS_IN_MONTH[i]) {
      return `${MONTH_LABELS[i]} ${remaining}`;
    }
    remaining -= DAYS_IN_MONTH[i];
  }
  return 'Dec 31';
};
