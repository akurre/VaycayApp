import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import MobileCompareSheet from '@/components/CityPopup/Mobile/MobileCompareSheet';
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

describe('MobileCompareSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useRecentCitiesStore.setState({ recentCities: [] });
    searchCitiesMock.mockResolvedValue([]);
  });

  it('renders empty-state copy when store + input are empty', () => {
    render(
      <MobileCompareSheet opened onClose={vi.fn()} onCitySelect={vi.fn()} />
    );
    expect(
      screen.getByText(/Search for a city to compare/i)
    ).toBeInTheDocument();
  });

  it('renders Suggested section with recent cities when input is empty', () => {
    useRecentCitiesStore.setState({ recentCities: [tokyo, berlin] });
    render(
      <MobileCompareSheet opened onClose={vi.fn()} onCitySelect={vi.fn()} />
    );
    expect(screen.getByText(/Suggested/i)).toBeInTheDocument();
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
  });

  it('selects a recent city: calls onCitySelect, pushes to store, closes', async () => {
    useRecentCitiesStore.setState({ recentCities: [tokyo, berlin] });
    const onCitySelect = vi.fn();
    const onClose = vi.fn();
    render(
      <MobileCompareSheet
        opened
        onClose={onClose}
        onCitySelect={onCitySelect}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Berlin'));
    });

    expect(onCitySelect).toHaveBeenCalledWith(berlin);
    expect(onClose).toHaveBeenCalled();
    expect(useRecentCitiesStore.getState().recentCities[0]).toEqual(berlin);
  });

  it('typed search renders results and pick triggers select+push+close', async () => {
    searchCitiesMock.mockResolvedValue([lisbon]);
    const onCitySelect = vi.fn();
    const onClose = vi.fn();
    render(
      <MobileCompareSheet
        opened
        onClose={onClose}
        onCitySelect={onCitySelect}
      />
    );

    const input = screen.getByPlaceholderText(/Search a city/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Lis' } });
    });

    const result = await screen.findByText('Lisbon');
    await act(async () => {
      fireEvent.click(result);
    });

    await waitFor(() => {
      expect(onCitySelect).toHaveBeenCalledWith(lisbon);
    });
    expect(onClose).toHaveBeenCalled();
    expect(useRecentCitiesStore.getState().recentCities[0]).toEqual(lisbon);
  });

  it('filters search results by excludeCity prop', async () => {
    searchCitiesMock.mockResolvedValue([tokyo, berlin]);
    render(
      <MobileCompareSheet
        opened
        onClose={vi.fn()}
        onCitySelect={vi.fn()}
        excludeCity={{
          name: 'Tokyo',
          state: null,
          country: 'Japan',
        }}
      />
    );

    const input = screen.getByPlaceholderText(/Search a city/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Tok' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Berlin')).toBeInTheDocument();
    });
    expect(screen.queryByText('Tokyo')).not.toBeInTheDocument();
  });

  it('X button dismisses without selecting', () => {
    const onClose = vi.fn();
    const onCitySelect = vi.fn();
    render(
      <MobileCompareSheet
        opened
        onClose={onClose}
        onCitySelect={onCitySelect}
      />
    );

    fireEvent.click(screen.getByLabelText(/Close compare sheet/i));
    expect(onClose).toHaveBeenCalled();
    expect(onCitySelect).not.toHaveBeenCalled();
  });
});
