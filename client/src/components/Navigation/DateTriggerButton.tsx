import { IconCalendar } from '@tabler/icons-react';
import formatDateForLabel from '@/utils/dateFormatting/formatDateForLabel';
import CommandBarTriggerButton from '@/components/Navigation/CommandBarTriggerButton';

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
  const label = formatDateForLabel(date, isMonthly);

  return (
    <CommandBarTriggerButton isOpen={isOpen} icon={IconCalendar}>
      {label}
    </CommandBarTriggerButton>
  );
};

export default DateTriggerButton;
