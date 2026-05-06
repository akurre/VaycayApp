import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import CityNamesHeader from '@/components/CityPopup/Ribbon/CityNamesHeader';
import type { SearchCitiesResult } from '@/types/userLocationType';

const makeCity = (
  overrides?: Partial<SearchCitiesResult>
): SearchCitiesResult => ({
  id: 1,
  name: 'Berlin',
  country: 'Germany',
  state: null,
  lat: 52.5,
  long: 13.4,
  population: 3_500_000,
  ...overrides,
});

describe('CityNamesHeader', () => {
  it('renders only the base city when no comparison is provided', () => {
    render(
      <CityNamesHeader
        baseCityName="Berlin"
        baseCityLat={52.5}
        comparisonCity={null}
      />
    );

    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.queryByText('Birmingham')).not.toBeInTheDocument();
  });

  it('renders both cities when a comparison is provided', () => {
    render(
      <CityNamesHeader
        baseCityName="Berlin"
        baseCityLat={52.5}
        comparisonCity={makeCity({ name: 'Birmingham', lat: 33.5 })}
      />
    );

    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText(/Birmingham/)).toBeInTheDocument();
  });

  it('renders the lat-suffix zone pill for the base city', () => {
    render(
      <CityNamesHeader
        baseCityName="Berlin"
        baseCityLat={52.5}
        comparisonCity={null}
      />
    );

    // 52.5° rounds to 53°N
    expect(screen.getByText(/53°N/)).toBeInTheDocument();
  });

  it('renders both lat-suffix pills in comparison mode', () => {
    render(
      <CityNamesHeader
        baseCityName="Berlin"
        baseCityLat={52.5}
        comparisonCity={makeCity({ name: 'São Paulo', lat: -23.5 })}
      />
    );

    expect(screen.getByText('53°N')).toBeInTheDocument();
    expect(screen.getByText('24°S')).toBeInTheDocument();
  });

  it('omits the zone pill when latitude is null', () => {
    const { container } = render(
      <CityNamesHeader
        baseCityName="Unknown"
        baseCityLat={null}
        comparisonCity={null}
      />
    );

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    // no rounded pill rendered
    expect(container.querySelector('span.uppercase')).not.toBeInTheDocument();
  });
});
