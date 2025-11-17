import { Divider, Text } from '@mantine/core';
import { SunshineData } from '@/types/sunshineDataType';
import Field from './Field';
import { MONTH_FIELDS, MONTH_NAMES } from '@/constants';

interface SunshineSectionProps {
  sunshineData: SunshineData;
  selectedMonth?: number;
}

const formatSunshineHours = (hours: number | null): string => {
  if (hours === null) return 'No data';
  return `${hours.toFixed(1)} hours`;
};

const SunshineSection = ({ sunshineData, selectedMonth }: SunshineSectionProps) => {
  // Get the sunshine hours for the selected month
  const getMonthValue = (month: number): number | null => {
    const field = MONTH_FIELDS[month];
    return sunshineData[field] as number | null;
  };

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
    <div>
      <Divider />
      <Text size="sm" fw={600} mb="xs">
        Sunshine
      </Text>
      <div>
        {selectedMonth && (
          <Field
            label={`${MONTH_NAMES[selectedMonth - 1]} Sunshine`}
            value={formatSunshineHours(getMonthValue(selectedMonth))}
          />
        )}
        <Field label="Average Annual Sunshine" value={formatSunshineHours(averageSunshine)} />
      </div>
    </div>
  );
};

export default SunshineSection;
