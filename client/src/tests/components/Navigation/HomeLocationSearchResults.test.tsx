import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import HomeLocationSearchResults from '@/components/Navigation/HomeLocationSearchResults';
import type { SearchCitiesResult } from '@/types/userLocationType';

const cities: SearchCitiesResult[] = [
  {
    id: 1,
    name: 'Paris',
    country: 'France',
    state: null,
    lat: 48.85,
    long: 2.35,
    population: 2_100_000,
  },
  {
    id: 2,
    name: 'Lyon',
    country: 'France',
    state: null,
    lat: 45.75,
    long: 4.85,
    population: 500_000,
  },
];

describe('HomeLocationSearchResults', () => {
  it('shows a loader when isLoading is true', () => {
    const { container } = render(
      <HomeLocationSearchResults
        results={[]}
        isLoading
        searchTerm="par"
        onSelect={vi.fn()}
      />
    );
    expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('renders results when present', () => {
    render(
      <HomeLocationSearchResults
        results={cities}
        isLoading={false}
        searchTerm="par"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Lyon')).toBeInTheDocument();
  });

  it('shows "No cities found" when query meets minimum length but yields no results', () => {
    render(
      <HomeLocationSearchResults
        results={[]}
        isLoading={false}
        searchTerm="zz"
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('No cities found')).toBeInTheDocument();
  });

  it('renders nothing when query is below minimum length', () => {
    render(
      <HomeLocationSearchResults
        results={[]}
        isLoading={false}
        searchTerm="z"
        onSelect={vi.fn()}
      />
    );
    expect(screen.queryByText('No cities found')).not.toBeInTheDocument();
    expect(
      document.querySelector('.mantine-Loader-root')
    ).not.toBeInTheDocument();
  });
});
