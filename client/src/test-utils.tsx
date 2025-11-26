/* eslint-disable react-refresh/only-export-components */
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { theme } from './theme';
import type { WeatherData } from './types/cityWeatherDataType';
import type { SunshineData } from './types/sunshineDataType';
import type { CityWeeklyWeather, WeekDataPoint } from './types/weeklyWeatherDataType';
import type { NearestCityResult } from './types/userLocationType';

// custom render function that includes all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything from testing library
export { screen, waitFor, within, fireEvent } from '@testing-library/react';
export { customRender as render };

// mock data factories for common test data
export const createMockWeatherData = (overrides?: Partial<WeatherData>): WeatherData => ({
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
  ...overrides,
});

export const createMockSunshineData = (overrides?: Partial<SunshineData>): SunshineData => ({
  city: 'Test City',
  country: 'Test Country',
  lat: 40.7128,
  long: -74.006,
  population: 1000000,
  jan: 150,
  feb: 140,
  mar: 180,
  apr: 200,
  may: 220,
  jun: 240,
  jul: 260,
  aug: 250,
  sep: 210,
  oct: 180,
  nov: 150,
  dec: 140,
  ...overrides,
});

export const createMockWeekDataPoint = (overrides?: Partial<WeekDataPoint>): WeekDataPoint => ({
  week: 1,
  avgTemp: 20,
  minTemp: 15,
  maxTemp: 25,
  totalPrecip: 10,
  avgPrecip: 2,
  daysWithRain: 3,
  daysWithData: 7,
  ...overrides,
});

export const createMockWeeklyWeather = (
  overrides?: Partial<CityWeeklyWeather>
): CityWeeklyWeather => ({
  city: 'Test City',
  country: 'Test Country',
  state: null,
  lat: 40.7128,
  long: -74.006,
  weeklyData: [createMockWeekDataPoint()],
  ...overrides,
});

// mock geolocation position for testing location-based features
export const createMockGeolocationPosition = (
  overrides?: Partial<GeolocationPosition>
): GeolocationPosition => ({
  coords: {
    latitude: 40.7128,
    longitude: -74.006,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    toJSON: () => ({}),
  },
  timestamp: Date.now(),
  toJSON: () => ({}),
  ...overrides,
});

// mock nearest city result for testing location queries
export const createMockNearestCity = (
  overrides?: Partial<NearestCityResult>
): NearestCityResult => ({
  id: 123,
  name: 'New York',
  country: 'United States',
  state: 'New York',
  lat: 40.7128,
  long: -74.006,
  population: 8000000,
  distance: 0.5,
  ...overrides,
});
