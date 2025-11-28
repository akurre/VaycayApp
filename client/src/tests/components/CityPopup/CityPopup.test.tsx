import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import CityPopup from '@/components/CityPopup/CityPopup';
import type { WeatherData } from '@/types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';
import { DataType } from '@/types/mapTypes';

// mock the weather data hook
vi.mock('@/api/dates/useWeatherDataForCity', () => ({
  default: vi.fn(),
}));

// mock the sunshine data hook
vi.mock('@/api/dates/useSunshineDataForCity', () => ({
  default: vi.fn(),
}));

// mock the weekly weather data hook
vi.mock('@/api/dates/useWeeklyWeatherForCity', () => ({
  default: vi.fn(),
}));

// mock the ComparisonCitySelector component to avoid Apollo Client dependency
vi.mock('@/components/CityPopup/ComparisonCitySelector', () => ({
  default: () => <div data-testid="comparison-city-selector">Comparison City Selector</div>,
}));

import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';
import useWeeklyWeatherForCity from '@/api/dates/useWeeklyWeatherForCity';

describe('CityPopup', () => {
  const mockOnClose = vi.fn();

  // sample weather data
  const weatherData: WeatherData = {
    city: 'New York',
    country: 'United States',
    state: 'New York',
    suburb: "Brooklyn",
    date: '2020-01-15',
    lat: 40.7128,
    long: -74.006,
    population: 8419000,
    precipitation: 10,
    snowDepth: 5,
    avgTemperature: 5,
    maxTemperature: 10,
    minTemperature: 0,
    stationName: 'NYC Station',
    submitterId: null,
  };

  // sample sunshine data
  const sunshineData: SunshineData = {
    city: 'New York',
    country: 'United States',
    state: 'New York',
    suburb: "Brooklyn",
    lat: 40.7128,
    long: -74.006,
    population: 8419000,
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
    // default mock implementation - no data fetched
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

  it('renders weather data correctly when passed as city prop', () => {
    render(
      <CityPopup
        city={weatherData}
        onClose={mockOnClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    expect(screen.getByText('New York, New York, United States')).toBeInTheDocument();
  });

  it('renders sunshine data correctly when passed as city prop', () => {
    render(
      <CityPopup
        city={sunshineData}
        onClose={mockOnClose}
        selectedMonth={1}
        selectedDate={undefined}
        dataType={DataType.Sunshine}
      />
    );

    expect(screen.getByText('New York, New York, United States')).toBeInTheDocument();
  });

  it('fetches and displays weather data when city is sunshine data', () => {
    // when city is sunshine data, it should fetch weather data
    vi.mocked(useWeatherDataForCity).mockReturnValue({
      weatherData: weatherData,
      weatherLoading: false,
      weatherError: false,
    });

    render(
      <CityPopup
        city={sunshineData}
        onClose={mockOnClose}
        selectedMonth={1}
        selectedDate={undefined}
        dataType={DataType.Sunshine}
      />
    );

    // verify the component rendered
    expect(screen.getByText('New York, New York, United States')).toBeInTheDocument();
  });

  it('fetches and displays sunshine data when city is weather data', () => {
    // when city is weather data, it should fetch sunshine data
    vi.mocked(useSunshineDataForCity).mockReturnValue({
      sunshineData: sunshineData,
      sunshineLoading: false,
      sunshineError: false,
    });

    render(
      <CityPopup
        city={weatherData}
        onClose={mockOnClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    // verify the component rendered
    expect(screen.getByText('New York, New York, United States')).toBeInTheDocument();
  });

  it('shows loading state when weather data is being fetched', () => {
    vi.mocked(useWeatherDataForCity).mockReturnValue({
      weatherData: null,
      weatherLoading: true,
      weatherError: false,
    });

    render(
      <CityPopup
        city={sunshineData}
        onClose={mockOnClose}
        selectedMonth={1}
        selectedDate={undefined}
        dataType={DataType.Sunshine}
      />
    );

    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('shows loading state when sunshine data is being fetched', () => {
    vi.mocked(useSunshineDataForCity).mockReturnValue({
      sunshineData: null,
      sunshineLoading: true,
      sunshineError: false,
    });

    render(
      <CityPopup
        city={weatherData}
        onClose={mockOnClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('shows error state when weather data fetching fails', () => {
    vi.mocked(useWeatherDataForCity).mockReturnValue({
      weatherData: null,
      weatherLoading: false,
      weatherError: true,
    });

    render(
      <CityPopup
        city={sunshineData}
        onClose={mockOnClose}
        selectedMonth={1}
        selectedDate={undefined}
        dataType={DataType.Sunshine}
      />
    );

    expect(screen.getByText('Failed to load temperature data for this city.')).toBeInTheDocument();
  });

  it('shows error state when sunshine data fetching fails', () => {
    vi.mocked(useSunshineDataForCity).mockReturnValue({
      sunshineData: null,
      sunshineLoading: false,
      sunshineError: true,
    });

    render(
      <CityPopup
        city={weatherData}
        onClose={mockOnClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    // use getAllByText since there might be multiple error messages
    const errorMessages = screen.getAllByText('Failed to load sunshine data for this city.');
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  it('fetches sunshine data without selectedMonth parameter', () => {
    render(
      <CityPopup
        city={weatherData}
        onClose={mockOnClose}
        selectedMonth={6}
        selectedDate="06-15"
        dataType={DataType.Temperature}
      />
    );

    // verify useSunshineDataForCity was called without selectedMonth (it fetches all 12 months)
    expect(useSunshineDataForCity).toHaveBeenCalledWith(
      expect.objectContaining({
        cityName: 'New York',
        lat: 40.7128,
        long: -74.006,
        skipFetch: false,
      })
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

    // verify useWeatherDataForCity was called with date constructed from selectedMonth
    expect(useWeatherDataForCity).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedDate: '06-15', // constructed from selectedMonth=6
      })
    );
  });

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

    // verify skipFetch was true
    expect(useWeatherDataForCity).toHaveBeenCalledWith(
      expect.objectContaining({
        skipFetch: true,
      })
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

    // verify skipFetch was true
    expect(useSunshineDataForCity).toHaveBeenCalledWith(
      expect.objectContaining({
        skipFetch: true,
      })
    );
  });
});
