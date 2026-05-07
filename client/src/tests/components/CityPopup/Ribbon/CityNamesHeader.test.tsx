import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import CityNamesHeader from '@/components/CityPopup/Ribbon/CityNamesHeader';

describe('CityNamesHeader', () => {
  it('renders the base city name', () => {
    render(<CityNamesHeader baseCityName="Berlin" baseCityLat={52.5} />);

    expect(screen.getByText('Berlin')).toBeInTheDocument();
  });

  it('renders the comparison node when provided', () => {
    render(
      <CityNamesHeader
        baseCityName="Berlin"
        baseCityLat={52.5}
        comparisonNode={<div>Birmingham, Alabama, US</div>}
      />
    );

    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Birmingham, Alabama, US')).toBeInTheDocument();
  });

  it('does not render a comparison row when no comparison node is provided', () => {
    render(<CityNamesHeader baseCityName="Berlin" baseCityLat={52.5} />);

    expect(screen.queryByText('Birmingham')).not.toBeInTheDocument();
  });

  it('renders the lat-suffix zone pill for the base city', () => {
    render(<CityNamesHeader baseCityName="Berlin" baseCityLat={52.5} />);

    // 52.5° rounds to 53°N
    expect(screen.getByText(/53°N/)).toBeInTheDocument();
  });

  it('omits the zone pill when latitude is null', () => {
    const { container } = render(
      <CityNamesHeader baseCityName="Unknown" baseCityLat={null} />
    );

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(container.querySelector('span.uppercase')).not.toBeInTheDocument();
  });
});
