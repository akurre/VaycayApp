import { Badge } from '@mantine/core';
import { CITY1_PRIMARY_COLOR, CITY2_PRIMARY_COLOR } from '@/const';

interface CityBadgeProps {
  cityName: string;
  isComparison?: boolean;
  mb?: number;
}

const CityBadge = ({ cityName, isComparison = false, mb }: CityBadgeProps) => {
  const color = isComparison ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR;

  return (
    <Badge
      variant="light"
      size="xs"
      style={{
        color,
        maxWidth: '120px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      mb={mb}
    >
      {cityName}
    </Badge>
  );
};

export default CityBadge;
