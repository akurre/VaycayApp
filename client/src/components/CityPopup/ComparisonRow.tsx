import { Badge, Text } from '@mantine/core';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface ComparisonRowProps {
  cityName: string;
  value: string;
  isComparison?: boolean;
  showCityBadge?: boolean;
}

const ComparisonRow = ({
  cityName,
  value,
  isComparison = false,
  showCityBadge = false,
}: ComparisonRowProps) => {
  const color = isComparison ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR;

  return (
    <div className="flex gap-2 justify-between">
      {showCityBadge && (
        <Badge variant="light" style={isComparison ? { color } : undefined}>
          {cityName}
        </Badge>
      )}
      <Text size="md" style={showCityBadge ? { color } : undefined}>
        {value}
      </Text>
    </div>
  );
};

export default ComparisonRow;
