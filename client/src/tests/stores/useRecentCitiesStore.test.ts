import { describe, it, expect, beforeEach } from 'vitest';
import { useRecentCitiesStore } from '@/stores/useRecentCitiesStore';
import type { SearchCitiesResult } from '@/types/userLocationType';
import { RECENT_CITIES_MAX } from '@/const';

const makeCity = (
  id: number,
  overrides?: Partial<SearchCitiesResult>
): SearchCitiesResult => ({
  id,
  name: `City ${id}`,
  country: 'Country',
  state: null,
  lat: id,
  long: id,
  population: 1000,
  ...overrides,
});

describe('useRecentCitiesStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useRecentCitiesStore.setState({ recentCities: [] });
  });

  it('initializes with empty recentCities', () => {
    expect(useRecentCitiesStore.getState().recentCities).toEqual([]);
  });

  it('pushes a city to the front of the list', () => {
    const cityA = makeCity(1);
    useRecentCitiesStore.getState().pushRecentCity(cityA);
    expect(useRecentCitiesStore.getState().recentCities).toEqual([cityA]);
  });

  it('orders newest-first when multiple cities are pushed', () => {
    const cityA = makeCity(1);
    const cityB = makeCity(2);
    useRecentCitiesStore.getState().pushRecentCity(cityA);
    useRecentCitiesStore.getState().pushRecentCity(cityB);
    expect(useRecentCitiesStore.getState().recentCities).toEqual([
      cityB,
      cityA,
    ]);
  });

  it('deduplicates by id when pushing an already-present city', () => {
    const cityA = makeCity(1);
    const cityB = makeCity(2);
    useRecentCitiesStore.getState().pushRecentCity(cityA);
    useRecentCitiesStore.getState().pushRecentCity(cityB);
    useRecentCitiesStore.getState().pushRecentCity(cityA);

    const { recentCities } = useRecentCitiesStore.getState();
    expect(recentCities.length).toBe(2);
    expect(recentCities[0]).toEqual(cityA);
    expect(recentCities[1]).toEqual(cityB);
  });

  it(`caps the list length at ${RECENT_CITIES_MAX}`, () => {
    for (let i = 1; i <= RECENT_CITIES_MAX + 1; i++) {
      useRecentCitiesStore.getState().pushRecentCity(makeCity(i));
    }
    const { recentCities } = useRecentCitiesStore.getState();
    expect(recentCities.length).toBe(RECENT_CITIES_MAX);
    expect(recentCities[0]?.id).toBe(RECENT_CITIES_MAX + 1);
    expect(recentCities[recentCities.length - 1]?.id).toBe(2);
  });

  it('persists to localStorage under recent-cities-storage', () => {
    useRecentCitiesStore.getState().pushRecentCity(makeCity(7));
    const stored = localStorage.getItem('recent-cities-storage');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored ?? '{}');
    expect(parsed.state.recentCities).toHaveLength(1);
    expect(parsed.state.recentCities[0].id).toBe(7);
  });
});
