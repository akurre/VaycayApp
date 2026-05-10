import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import ComparisonCitySelector from '@/components/CityPopup/ComparisonCitySelector';
import { useRecentCitiesStore } from '@/stores/useRecentCitiesStore';
import type { SearchCitiesResult } from '@/types/userLocationType';

const tokyo: SearchCitiesResult = {
  id: 100,
  name: 'Tokyo',
  country: 'Japan',
  state: null,
  lat: 35.6762,
  long: 139.6503,
  population: 13_960_000,
};

const searchCitiesMock =
  vi.fn<(term: string) => Promise<SearchCitiesResult[]>>();

vi.mock('@/hooks/useCitySearch', () => ({
  default: () => ({
    searchCities: searchCitiesMock,
    selectCity: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

describe('ComparisonCitySelector — recent cities dual-write', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useRecentCitiesStore.setState({ recentCities: [] });
    searchCitiesMock.mockResolvedValue([tokyo]);
  });

  it('pushes the picked city to useRecentCitiesStore on typed-search select', async () => {
    const onCitySelect = vi.fn();
    render(
      <ComparisonCitySelector
        onCitySelect={onCitySelect}
        onCityRemove={vi.fn()}
        selectedCity={null}
      />
    );

    fireEvent.click(screen.getByLabelText('Add comparison city'));

    const input = await screen.findByPlaceholderText('Compare a city…');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Tok' } });
    });

    const result = await screen.findByText('Tokyo');
    await act(async () => {
      fireEvent.click(result);
    });

    await waitFor(() => {
      expect(onCitySelect).toHaveBeenCalledWith(tokyo);
    });
    expect(useRecentCitiesStore.getState().recentCities).toEqual([tokyo]);
  });
});
