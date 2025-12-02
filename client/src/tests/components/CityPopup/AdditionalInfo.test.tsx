import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import AdditionalInfo from '@/components/CityPopup/AdditionalInfo';
import type { WeatherDataUnion } from '@/types/mapTypes';

describe('AdditionalInfo', () => {
  const mockCity: WeatherDataUnion = {
    cityId: 234,
    city: 'Test City',
    country: 'Test Country',
    state: null,
    suburb: null,
    lat: 40.7128,
    long: -74.006,
    population: 1000000,
    date: '2024-01-15',
    precipitation: 50,
    snowDepth: null,
    avgTemperature: 20,
    maxTemperature: 25,
    minTemperature: 15,
    stationName: 'Test Station',
    submitterId: null,
  };

  it('renders city population when available', () => {
    render(<AdditionalInfo city={mockCity} />);

    expect(screen.getByText('Population')).toBeInTheDocument();
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
  });

  it('renders without population when not available', () => {
    const cityWithoutPopulation = { ...mockCity, population: null };
    render(<AdditionalInfo city={cityWithoutPopulation} />);

    expect(screen.queryByText('Population')).not.toBeInTheDocument();
  });

  it('renders DistanceSection with city coordinates', () => {
    render(<AdditionalInfo city={mockCity} />);

    // distancesection should be rendered (it will show either distance or "set home location" message)
    const distanceSection = screen.getByText(
      /Distance from home|Set home location to see distance/i
    );
    expect(distanceSection).toBeInTheDocument();
  });

  it('formats population with locale string', () => {
    const cityWithLargePopulation = { ...mockCity, population: 8500000 };
    render(<AdditionalInfo city={cityWithLargePopulation} />);

    expect(screen.getByText('8,500,000')).toBeInTheDocument();
  });
});
