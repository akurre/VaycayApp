import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import CityPopup from '@/components/CityPopup/CityPopup';
import type { WeatherData } from '@/types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import { DataType } from '@/types/mapTypes';

vi.mock('@/api/dates/useWeatherDataForCity', () => ({
  default: vi.fn(),
}));

vi.mock('@/api/dates/useSunshineDataForCity', () => ({
  default: vi.fn(),
}));

vi.mock('@/api/dates/useWeeklyWeatherForCity', () => ({
  default: vi.fn(),
}));

vi.mock('@/components/CityPopup/ComparisonCitySelector', () => ({
  default: () => (
    <div data-testid="comparison-city-selector">Comparison City Selector</div>
  ),
}));

vi.mock('@/components/CityPopup/DataChartTabs', () => ({
  default: ({ tab }: { tab: DataType }) => (
    <div data-testid="data-chart-tabs">tab:{tab}</div>
  ),
}));

import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';
import useWeeklyWeatherForCity from '@/api/dates/useWeeklyWeatherForCity';

describe('CityPopup', () => {
  const mockOnClose = vi.fn();

  const weatherData: WeatherData = {
    cityId: 235,
    city: 'New York',
    country: 'United States',
    state: 'New York',
    suburb: 'Brooklyn',
    date: '2020-01-15',
    lat: 40.7128,
    long: -74.006,
    population: 8_419_000,
    precipitation: 10,
    snowDepth: 5,
    avgTemperature: 5,
    maxTemperature: 10,
    minTemperature: 0,
    stationName: 'NYC Station',
    submitterId: null,
  };

  const sunshineData: SunshineData = {
    cityId: 235,
    city: 'New York',
    country: 'United States',
    state: 'New York',
    suburb: 'Brooklyn',
    lat: 40.7128,
    long: -74.006,
    population: 8_419_000,
    jan: 150,
    feb: 160,
    mar: 170,
    apr: 180,
    may: 190,
    jun: 200,
    jul: 210,
    aug: 200,
    sep: 190,
    oct: 180,
    nov: 170,
    dec: 160,
    stationName: 'NYC Station',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWeatherDataForCity).mockReturnValue({
      weatherData: null,
      weatherLoading: false,
      weatherError: false,
    });
    vi.mocked(useSunshineDataForCity).mockReturnValue({
      sunshineData: null,
      sunshineLoading: false,
      sunshineError: false,
    });
    vi.mocked(useWeeklyWeatherForCity).mockReturnValue({
      weeklyWeatherData: null,
      loading: false,
      error: false,
    });
  });

  describe('rendering', () => {
    it('renders the city name in the ribbon header', () => {
      render(
        <CityPopup
          city={weatherData}
          onClose={mockOnClose}
          selectedMonth={1}
          selectedDate="01-15"
          dataType={DataType.Temperature}
        />
      );

      expect(
        screen.getByText('New York, New York, United States')
      ).toBeInTheDocument();
    });

    it('renders the close button with an aria label', () => {
      render(
        <CityPopup
          city={weatherData}
          onClose={mockOnClose}
          selectedMonth={1}
          selectedDate="01-15"
          dataType={DataType.Temperature}
        />
      );

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('renders the comparison city selector', () => {
      render(
        <CityPopup
          city={weatherData}
          onClose={mockOnClose}
          selectedMonth={1}
          selectedDate="01-15"
          dataType={DataType.Temperature}
        />
      );

      expect(
        screen.getByTestId('comparison-city-selector')
      ).toBeInTheDocument();
    });

    it('renders the chart panel', () => {
      render(
        <CityPopup
          city={weatherData}
          onClose={mockOnClose}
          selectedMonth={1}
          selectedDate="01-15"
          dataType={DataType.Temperature}
        />
      );

      expect(screen.getByTestId('data-chart-tabs')).toBeInTheDocument();
    });

    it('renders all five stat-rail labels', () => {
      render(
        <CityPopup
          city={weatherData}
          onClose={mockOnClose}
          selectedMonth={1}
          selectedDate="01-15"
          dataType={DataType.Temperature}
        />
      );

      expect(screen.getByText('Sun / yr')).toBeInTheDocument();
      expect(screen.getByText('Rain / yr')).toBeInTheDocument();
      expect(screen.getByText("This day's range")).toBeInTheDocument();
      expect(screen.getByText('From home')).toBeInTheDocument();
      expect(screen.getByText('Population')).toBeInTheDocument();
    });

    it('opens with the temperature tab active when dataType is Temperature', () => {
      render(
        <CityPopup
          city={weatherData}
          onClose={mockOnClose}
          selectedMonth={1}
          selectedDate="01-15"
          dataType={DataType.Temperature}
        />
      );

      expect(screen.getByText('tab:temperature')).toBeInTheDocument();
    });

    it('opens with the sunshine tab active when dataType is Sunshine', () => {
      render(
        <CityPopup
          city={sunshineData}
          onClose={mockOnClose}
          selectedMonth={6}
          selectedDate={undefined}
          dataType={DataType.Sunshine}
        />
      );

      expect(screen.getByText('tab:sunshine')).toBeInTheDocument();
    });

    it('returns null when no city is provided', () => {
      const { container } = render(
        <CityPopup
          city={null}
          onClose={mockOnClose}
          selectedMonth={1}
          selectedDate="01-15"
          dataType={DataType.Temperature}
        />
      );

      // MantineProvider injects a <style> element regardless. The popup root
      // shouldn't render — querying for the close button is sufficient.
      expect(container.querySelector('[aria-label="Close"]')).toBeNull();
    });
  });

  describe('hook wiring', () => {
    it('skips fetching weather data when city is already weather data', () => {
      render(
        <CityPopup
          city={weatherData}
          onClose={mockOnClose}
          selectedMonth={1}
          selectedDate="01-15"
          dataType={DataType.Temperature}
        />
      );

      expect(useWeatherDataForCity).toHaveBeenCalledWith(
        expect.objectContaining({ skipFetch: true })
      );
    });

    it('skips fetching sunshine data when city is already sunshine data', () => {
      render(
        <CityPopup
          city={sunshineData}
          onClose={mockOnClose}
          selectedMonth={1}
          selectedDate={undefined}
          dataType={DataType.Sunshine}
        />
      );

      expect(useSunshineDataForCity).toHaveBeenCalledWith(
        expect.objectContaining({ skipFetch: true })
      );
    });

    it('uses selectedMonth to construct date when city is sunshine data', () => {
      render(
        <CityPopup
          city={sunshineData}
          onClose={mockOnClose}
          selectedMonth={6}
          selectedDate={undefined}
          dataType={DataType.Sunshine}
        />
      );

      expect(useWeatherDataForCity).toHaveBeenCalledWith(
        expect.objectContaining({ selectedDate: '06-15' })
      );
    });
  });
});
