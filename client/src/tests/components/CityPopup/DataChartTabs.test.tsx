import { describe, it, expect, vi } from 'vitest';
import { render } from '@/test-utils';
import DataChartTabs from '@/components/CityPopup/DataChartTabs';
import type { SunshineData } from '@/types/sunshineDataType';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import { DataType } from '@/types/mapTypes';

vi.mock('@/components/CityPopup/TemperatureDataSection', () => ({
  default: () => <div data-testid="panel-temperature">temp panel</div>,
}));
vi.mock('@/components/CityPopup/SunshineDataSection', () => ({
  default: () => <div data-testid="panel-sunshine">sun panel</div>,
}));
vi.mock('@/components/CityPopup/RainfallDataSection', () => ({
  default: () => <div data-testid="panel-precip">precip panel</div>,
}));

const mockSunshineData: SunshineData = {
  cityId: 213,
  city: 'Test City',
  country: 'Test Country',
  lat: 40.7,
  long: -74,
  population: 1_000_000,
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
};

const mockWeeklyWeather: CityWeeklyWeather = {
  city: 'Test City',
  country: 'Test Country',
  state: null,
  lat: 40.7,
  long: -74,
  weeklyData: [
    {
      week: 1,
      avgTemp: 20,
      minTemp: 15,
      maxTemp: 25,
      totalPrecip: 10,
      avgPrecip: 2,
      daysWithRain: 3,
      daysWithData: 7,
    },
  ],
};

const baseProps = {
  displaySunshineData: mockSunshineData,
  sunshineLoading: false,
  sunshineError: false,
  selectedMonth: 1,
  weeklyWeatherData: mockWeeklyWeather,
  weeklyWeatherLoading: false,
  weeklyWeatherError: false,
};

describe('DataChartTabs', () => {
  it('renders the temperature panel when tab=Temperature', () => {
    const { getByTestId, queryByTestId } = render(
      <DataChartTabs tab={DataType.Temperature} {...baseProps} />
    );
    expect(getByTestId('panel-temperature')).toBeInTheDocument();
    expect(queryByTestId('panel-sunshine')).not.toBeInTheDocument();
    expect(queryByTestId('panel-precip')).not.toBeInTheDocument();
  });

  it('renders the sunshine panel when tab=Sunshine', () => {
    const { getByTestId, queryByTestId } = render(
      <DataChartTabs tab={DataType.Sunshine} {...baseProps} />
    );
    expect(getByTestId('panel-sunshine')).toBeInTheDocument();
    expect(queryByTestId('panel-temperature')).not.toBeInTheDocument();
    expect(queryByTestId('panel-precip')).not.toBeInTheDocument();
  });

  it('renders the precip panel when tab=Precip', () => {
    const { getByTestId, queryByTestId } = render(
      <DataChartTabs tab={DataType.Precip} {...baseProps} />
    );
    expect(getByTestId('panel-precip')).toBeInTheDocument();
    expect(queryByTestId('panel-temperature')).not.toBeInTheDocument();
    expect(queryByTestId('panel-sunshine')).not.toBeInTheDocument();
  });

  it('accepts an onHover prop without error', () => {
    const onHover = vi.fn();
    render(
      <DataChartTabs
        tab={DataType.Temperature}
        {...baseProps}
        onHover={onHover}
      />
    );
    // The mocked panel doesn't fire onHover; this test just guards the prop
    // surface compiles and renders.
    expect(onHover).not.toHaveBeenCalled();
  });
});
