import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import HomeLocationSearchResult from '@/components/Navigation/HomeLocationSearchResult';
import type { SearchCitiesResult } from '@/types/userLocationType';

const baseCity: SearchCitiesResult = {
  id: 1,
  name: 'New York',
  country: 'United States',
  state: 'New York',
  lat: 40.7128,
  long: -74.006,
  population: 8000000,
};

describe('HomeLocationSearchResult', () => {
  it('renders city name, state, and country', () => {
    render(<HomeLocationSearchResult city={baseCity} onSelect={vi.fn()} />);
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText(/New York, United States/)).toBeInTheDocument();
  });

  it('renders population in millions when present', () => {
    render(<HomeLocationSearchResult city={baseCity} onSelect={vi.fn()} />);
    expect(screen.getByText(/• 8\.0M/)).toBeInTheDocument();
  });

  it('omits population suffix when population is missing', () => {
    const city = { ...baseCity, population: null };
    render(<HomeLocationSearchResult city={city} onSelect={vi.fn()} />);
    expect(screen.queryByText(/M$/)).not.toBeInTheDocument();
  });

  it('omits state segment when state is missing', () => {
    const city = { ...baseCity, state: null };
    render(<HomeLocationSearchResult city={city} onSelect={vi.fn()} />);
    expect(screen.getByText(/United States/)).toBeInTheDocument();
    expect(screen.queryByText(/, United States/)).not.toBeInTheDocument();
  });

  it('calls onSelect with the city when clicked', () => {
    const onSelect = vi.fn();
    render(<HomeLocationSearchResult city={baseCity} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('New York'));
    expect(onSelect).toHaveBeenCalledWith(baseCity);
  });
});
