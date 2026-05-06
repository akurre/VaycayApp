import { Button, useMantineColorScheme } from '@mantine/core';
import { IconCalendar } from '@tabler/icons-react';
import { TOGGLE_ICON_SIZE, monthlyMarks } from '@/const';
import { dateToDayOfYear } from '@/utils/dateFormatting/dateToDayOfYear';
import formatSliderLabel from '@/utils/dateFormatting/formatSliderLabel';
import { secondaryOceanShades } from '@/theme';

interface DateTriggerButtonProps {
  isOpen: boolean;
  date: string;
  isMonthly: boolean;
}

const DateTriggerButton = ({
  isOpen,
  date,
  isMonthly,
}: DateTriggerButtonProps) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  const label = isMonthly
    ? (monthlyMarks.find(
        (mark) =>
          mark.value === Number.parseInt(date.substring(0, 2), 10)
      )?.label ?? '')
    : formatSliderLabel(dateToDayOfYear(date));

  return (
    <Button
      variant={isOpen ? 'light' : 'outline'}
      color={isDark ? secondaryOceanShades[2] : secondaryOceanShades[4]}
      size="xs"
      leftSection={<IconCalendar size={TOGGLE_ICON_SIZE} />}
    >
      {label}
    </Button>
  );
};

export default DateTriggerButton;
