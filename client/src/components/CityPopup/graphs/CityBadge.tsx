import { Badge } from '@mantine/core';
import { CITY1_PRIMARY_COLOR, CITY2_BADGE_BACKGROUND, CITY2_PRIMARY_COLOR } from '@/const';

interface CityBadgeProps {
  cityName: string;
  isComparison?: boolean;
  mb?: number;
  isLarge?: boolean;
}

const CityBadge = ({
  cityName,
  isComparison = false,
  mb,
  isLarge = false,
}: CityBadgeProps) => {
  const color = isComparison ? CITY2_PRIMARY_COLOR : CITY1_PRIMARY_COLOR;

  return (
    <Badge
      variant="light"
      size={isLarge ? 'xl' : 'xs'}
      style={{
        color,
        backgroundColor: isComparison ? CITY2_BADGE_BACKGROUND : undefined,
        maxWidth: isLarge ? undefined : '120px',
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
