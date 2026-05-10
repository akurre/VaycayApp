import type { SearchCitiesResult } from '@/types/userLocationType';

const formatCityFullName = ({
  name,
  state,
  country,
}: Pick<SearchCitiesResult, 'name' | 'state' | 'country'>): string =>
  [name, state, country].filter(Boolean).join(', ');

export default formatCityFullName;
