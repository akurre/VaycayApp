import type { SunshineData } from '@/types/sunshineDataType';
import { MONTH_FIELDS } from '@/const';
import GreaterSection from './GreaterSection';
import getSunshineHoursIcon from '@/utils/iconMapping/getSunshineIcon';
import SunshineGraph from './SunshineGraph';

interface SunshineSectionProps {
  sunshineData: SunshineData;
  selectedMonth?: number;
}

const SunshineSection = ({ sunshineData, selectedMonth }: SunshineSectionProps) => {
  // get the sunshine hours for the selected month
  const getMonthValue = (month: number): number | null => {
    const field = MONTH_FIELDS[month];
    return sunshineData[field] as number | null;
  };

  // get the icon based on the selected month's sunshine hours
  const monthValue = selectedMonth ? getMonthValue(selectedMonth) : null;
  const sunshineIcon = getSunshineHoursIcon(monthValue);

  return (
    <GreaterSection title="Sunshine" icon={sunshineIcon}>
      <SunshineGraph sunshineData={sunshineData} selectedMonth={selectedMonth} />
    </GreaterSection>
  );
}

export default SunshineSection;
