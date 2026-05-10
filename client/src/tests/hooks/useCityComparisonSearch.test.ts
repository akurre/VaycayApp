import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useCityComparisonSearch from '@/hooks/useCityComparisonSearch';
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

describe('useCityComparisonSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchCitiesMock.mockResolvedValue([]);
  });

  it('returns empty results without searching when term is below MIN length', async () => {
    const { result } = renderHook(() => useCityComparisonSearch('a'));

    // wait past the debounce window to be sure no call was scheduled
    await new Promise((r) => setTimeout(r, 350));

    expect(result.current.results).toEqual([]);
    expect(searchCitiesMock).not.toHaveBeenCalled();
  });

  it('returns search results once the debounced term reaches MIN length', async () => {
    searchCitiesMock.mockResolvedValue([tokyo]);
    const { result } = renderHook(() => useCityComparisonSearch('Tok'));

    await waitFor(() => {
      expect(searchCitiesMock).toHaveBeenCalledWith('Tok');
    });
    await waitFor(() => {
      expect(result.current.results).toEqual([tokyo]);
    });
  });

  it('coalesces rapid term changes into a single search for the latest term', async () => {
    searchCitiesMock.mockResolvedValue([lisbon]);
    const { rerender } = renderHook(
      (term: string) => useCityComparisonSearch(term),
      { initialProps: 'L' }
    );
    rerender('Li');
    rerender('Lis');

    await waitFor(() => {
      expect(searchCitiesMock).toHaveBeenCalledTimes(1);
    });
    expect(searchCitiesMock).toHaveBeenLastCalledWith('Lis');
  });

  it('out-of-order responses do not clobber the latest results', async () => {
    let resolveFirst!: (val: SearchCitiesResult[]) => void;
    const firstPromise = new Promise<SearchCitiesResult[]>((r) => {
      resolveFirst = r;
    });
    searchCitiesMock.mockImplementationOnce(() => firstPromise);
    searchCitiesMock.mockResolvedValueOnce([lisbon]);

    const { rerender, result } = renderHook(
      (term: string) => useCityComparisonSearch(term),
      { initialProps: 'Tok' }
    );

    // first call kicks off after the debounce
    await waitFor(() => {
      expect(searchCitiesMock).toHaveBeenCalledTimes(1);
    });

    rerender('Lis');

    // second call kicks off after the next debounce
    await waitFor(() => {
      expect(searchCitiesMock).toHaveBeenCalledTimes(2);
    });

    // resolve the stale first call AFTER the second was issued — it must be ignored
    resolveFirst([tokyo]);

    await waitFor(() => {
      expect(result.current.results).toEqual([lisbon]);
    });
    // small grace window to confirm the stale response stayed ignored
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.results).toEqual([lisbon]);
  });

  it('clears results when the term drops back below MIN length', async () => {
    searchCitiesMock.mockResolvedValue([tokyo]);
    const { rerender, result } = renderHook(
      (term: string) => useCityComparisonSearch(term),
      { initialProps: 'Tok' }
    );

    await waitFor(() => {
      expect(result.current.results).toEqual([tokyo]);
    });

    rerender('');

    await waitFor(() => {
      expect(result.current.results).toEqual([]);
    });
  });
});
