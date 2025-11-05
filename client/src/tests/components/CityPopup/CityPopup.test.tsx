import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import CityPopup from '@/components/CityPopup/CityPopup';
import { WeatherData } from '@/types/cityWeatherDataType';

const mockCity: WeatherData = {
  city: 'san francisco',
  country: 'United States',
  state: 'california',
  suburb: null,
  date: '2024-01-15',
  lat: 37.7749,
  long: -122.4194,
  avgTemperature: 15.5,
  maxTemperature: 20.0,
  minTemperature: 10.0,
  precipitation: 5.2,
  snowDepth: 0,
  population: 873965,
  stationName: 'San Francisco International Airport',
  submitterId: null,
};

describe('CityPopup', () => {
  const mockOnClose = vi.fn();

  it('renders nothing when city is null', () => {
    const { container } = render(<CityPopup city={null} onClose={mockOnClose} />);
    // mantine adds style tags, so we check that no modal is rendered
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('renders city name and country in title', () => {
    render(<CityPopup city={mockCity} onClose={mockOnClose} />);

    // use getAllByText since "San Francisco" appears in both title and weather station
    const elements = screen.getAllByText(/San Francisco/i);
    expect(elements.length).toBeGreaterThan(0);
    expect(screen.getByText(/United States/i)).toBeInTheDocument();
  });

  it('renders state when provided', () => {
    render(<CityPopup city={mockCity} onClose={mockOnClose} />);

    expect(screen.getByText('State/Region')).toBeInTheDocument();
    expect(screen.getByText('California')).toBeInTheDocument();
  });

  it('renders date', () => {
    render(<CityPopup city={mockCity} onClose={mockOnClose} />);

    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('renders temperature section', () => {
    render(<CityPopup city={mockCity} onClose={mockOnClose} />);

    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();
  });

  it('renders precipitation section when precipitation exists', () => {
    render(<CityPopup city={mockCity} onClose={mockOnClose} />);

    expect(screen.getByText('Precipitation')).toBeInTheDocument();
    expect(screen.getByText('Rainfall')).toBeInTheDocument();
    expect(screen.getByText('Snow Depth')).toBeInTheDocument();
  });

  it('does not render precipitation section when precipitation is null', () => {
    const cityWithoutPrecipitation = { ...mockCity, precipitation: null };
    render(<CityPopup city={cityWithoutPrecipitation} onClose={mockOnClose} />);

    expect(screen.queryByText('Precipitation')).not.toBeInTheDocument();
  });

  it('renders population when provided', () => {
    render(<CityPopup city={mockCity} onClose={mockOnClose} />);

    expect(screen.getByText('Population')).toBeInTheDocument();
    expect(screen.getByText('873,965')).toBeInTheDocument();
  });

  it('renders weather station', () => {
    render(<CityPopup city={mockCity} onClose={mockOnClose} />);

    expect(screen.getByText('Weather Station')).toBeInTheDocument();
    expect(screen.getByText('San Francisco International Airport')).toBeInTheDocument();
  });

  it('renders coordinates', () => {
    render(<CityPopup city={mockCity} onClose={mockOnClose} />);

    expect(screen.getByText('Coordinates')).toBeInTheDocument();
    expect(screen.getByText(/37.7749°, -122.4194°/)).toBeInTheDocument();
  });

  it('does not render suburb when not provided', () => {
    render(<CityPopup city={mockCity} onClose={mockOnClose} />);

    expect(screen.queryByText('Suburb')).not.toBeInTheDocument();
  });

  it('renders suburb when provided', () => {
    const cityWithSuburb = { ...mockCity, suburb: 'mission district' };
    render(<CityPopup city={cityWithSuburb} onClose={mockOnClose} />);

    expect(screen.getByText('Suburb')).toBeInTheDocument();
    expect(screen.getByText('Mission District')).toBeInTheDocument();
  });

  it('applies theme-based background colors to modal', () => {
    render(<CityPopup city={mockCity} onClose={mockOnClose} />);

    // verify modal is rendered with role
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();

    // verify background color is applied
    expect(modal).toHaveStyle({ backgroundColor: expect.any(String) });
  });
});
