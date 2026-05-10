import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import ComparisonCitySelector from '@/components/CityPopup/ComparisonCitySelector';
import { useRecentCitiesStore } from '@/stores/useRecentCitiesStore';
import { MIN_CITY_SEARCH_LENGTH } from '@/const';
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

const berlin: SearchCitiesResult = {
  id: 101,
  name: 'Berlin',
  country: 'Germany',
  state: null,
  lat: 52.52,
  long: 13.405,
  population: 3_645_000,
};

const lisbon: SearchCitiesResult = {
  id: 102,
  name: 'Lisbon',
  country: 'Portugal',
  state: null,
  lat: 38.7223,
  long: -9.1393,
  population: 545_000,
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

const openPopover = () =>
  fireEvent.click(screen.getByLabelText('Add comparison city'));

describe('ComparisonCitySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useRecentCitiesStore.setState({ recentCities: [] });
    searchCitiesMock.mockResolvedValue([]);
  });

  describe('typed search', () => {
    it('pushes the picked city to useRecentCitiesStore on typed-search select', async () => {
      searchCitiesMock.mockResolvedValue([tokyo]);
      const onCitySelect = vi.fn();
      render(
        <ComparisonCitySelector
          onCitySelect={onCitySelect}
          onCityRemove={vi.fn()}
          selectedCity={null}
        />
      );

      openPopover();

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

    it('filters typed-search results by excludeCity', async () => {
      searchCitiesMock.mockResolvedValue([tokyo, berlin]);
      render(
        <ComparisonCitySelector
          onCitySelect={vi.fn()}
          onCityRemove={vi.fn()}
          selectedCity={null}
          excludeCity={{ name: 'Tokyo', state: null, country: 'Japan' }}
        />
      );

      openPopover();

      const input = await screen.findByPlaceholderText('Compare a city…');
      await act(async () => {
        fireEvent.change(input, { target: { value: 'Tok' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Berlin')).toBeInTheDocument();
      });
      expect(screen.queryByText('Tokyo')).not.toBeInTheDocument();
    });
  });

  describe('Suggested section', () => {
    it(`renders Suggested with recent cities when popover opens with input shorter than ${MIN_CITY_SEARCH_LENGTH} chars`, async () => {
      useRecentCitiesStore.setState({ recentCities: [tokyo, berlin] });
      render(
        <ComparisonCitySelector
          onCitySelect={vi.fn()}
          onCityRemove={vi.fn()}
          selectedCity={null}
        />
      );

      openPopover();

      expect(await screen.findByText(/Suggested/i)).toBeInTheDocument();
      expect(screen.getByText('Tokyo')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
    });

    it('renders the existing prompt-to-search copy when store + input are empty (no Suggested header)', async () => {
      render(
        <ComparisonCitySelector
          onCitySelect={vi.fn()}
          onCityRemove={vi.fn()}
          selectedCity={null}
        />
      );

      openPopover();

      expect(
        await screen.findByText(
          new RegExp(`Type at least ${MIN_CITY_SEARCH_LENGTH} characters`, 'i')
        )
      ).toBeInTheDocument();
      expect(screen.queryByText(/Suggested/i)).not.toBeInTheDocument();
    });

    it('selecting a Suggested city calls onCitySelect and reorders the store newest-first', async () => {
      useRecentCitiesStore.setState({ recentCities: [tokyo, berlin] });
      const onCitySelect = vi.fn();
      render(
        <ComparisonCitySelector
          onCitySelect={onCitySelect}
          onCityRemove={vi.fn()}
          selectedCity={null}
        />
      );

      openPopover();

      const berlinRow = await screen.findByText('Berlin');
      await act(async () => {
        fireEvent.click(berlinRow);
      });

      expect(onCitySelect).toHaveBeenCalledWith(berlin);
      expect(useRecentCitiesStore.getState().recentCities[0]).toEqual(berlin);
      expect(useRecentCitiesStore.getState().recentCities[1]).toEqual(tokyo);
    });

    it('filters Suggested cities by excludeCity', async () => {
      useRecentCitiesStore.setState({ recentCities: [tokyo, berlin, lisbon] });
      render(
        <ComparisonCitySelector
          onCitySelect={vi.fn()}
          onCityRemove={vi.fn()}
          selectedCity={null}
          excludeCity={{ name: 'Berlin', state: null, country: 'Germany' }}
        />
      );

      openPopover();

      expect(await screen.findByText('Tokyo')).toBeInTheDocument();
      expect(screen.getByText('Lisbon')).toBeInTheDocument();
      expect(screen.queryByText('Berlin')).not.toBeInTheDocument();
    });
  });
});
