import { UnstyledButton, Text } from '@mantine/core';
import useGlassTokens from '@/hooks/useGlassTokens';
import type { SearchCitiesResult } from '@/types/userLocationType';

interface HomeLocationSearchResultProps {
  city: SearchCitiesResult;
  onSelect: (city: SearchCitiesResult) => void;
}

const HomeLocationSearchResult = ({
  city,
  onSelect,
}: HomeLocationSearchResultProps) => {
  const glass = useGlassTokens();
  const populationLabel = city.population
    ? ` • ${(city.population / 1000000).toFixed(1)}M`
    : '';

  return (
    <UnstyledButton
      onClick={() => onSelect(city)}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = glass.triggerIdleBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      className="w-full text-left px-3 py-2 rounded text-sm transition-colors"
    >
      <Text size="sm" fw={500}>
        {city.name}
      </Text>
      <Text size="xs" c="dimmed">
        {city.state && `${city.state}, `}
        {city.country}
        {populationLabel}
      </Text>
    </UnstyledButton>
  );
};

export default HomeLocationSearchResult;
