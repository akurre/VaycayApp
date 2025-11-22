import type { SunshineData } from '@/types/sunshineDataType';
import Field from './Field';
import { MONTH_FIELDS, MONTH_NAMES } from '@/const';
import GreaterSection from './GreaterSection';
import getSunshineHoursIcon from '@/utils/iconMapping/getSunshineIcon';

interface SunshineSectionProps {
  sunshineData: SunshineData;
  selectedMonth?: number;
}

const formatSunshineHours = (hours: number | null): string => {
  if (hours === null) return 'No data';
  return `${hours.toFixed(1)} hours`;
};

const SunshineSection = ({ sunshineData, selectedMonth }: SunshineSectionProps) => {
  // get the sunshine hours for the selected month
  const getMonthValue = (month: number): number | null => {
    const field = MONTH_FIELDS[month];
    return sunshineData[field] as number | null;
  };

  // get the icon based on the selected month's sunshine hours
  const monthValue = selectedMonth ? getMonthValue(selectedMonth) : null;
  const sunshineIcon = getSunshineHoursIcon(monthValue);

  // Calculate average sunshine hours across all available months
  const calculateAverageSunshine = (): number | null => {
    const availableMonths = Object.values(MONTH_FIELDS)
      .map((field) => sunshineData[field])
      .filter((value): value is number => value !== null);

    if (availableMonths.length === 0) return null;

    const sum = availableMonths.reduce((acc, val) => acc + val, 0);
    return sum / availableMonths.length;
  };

  const averageSunshine = calculateAverageSunshine();

  return (
    <GreaterSection title="Sunshine" icon={sunshineIcon}>
      {selectedMonth && (
        <Field
          label={`${MONTH_NAMES[selectedMonth - 1]} Sunshine`}
          value={formatSunshineHours(getMonthValue(selectedMonth))}
        />
      )}
      <div className="mt-3">
        <Field label="Average Annual Sunshine" value={formatSunshineHours(averageSunshine)} />
      </div>
    </GreaterSection>
  );
};

export default SunshineSection;
