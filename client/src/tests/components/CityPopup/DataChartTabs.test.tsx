import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import { userEvent } from '@testing-library/user-event';
import DataChartTabs from '@/components/CityPopup/DataChartTabs';
import type { SunshineData } from '@/types/sunshineDataType';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';
import { DataType } from '@/types/mapTypes';

describe('DataChartTabs', () => {
  const mockSunshineData: SunshineData = {
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
  };

  const mockWeeklyWeather: CityWeeklyWeather = {
    city: 'Test City',
    country: 'Test Country',
    state: null,
    lat: 40.7128,
    long: -74.006,
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

  it('renders all three tabs', () => {
    render(
      <DataChartTabs
        displaySunshineData={mockSunshineData}
        sunshineLoading={false}
        sunshineError={false}
        selectedMonth={1}
        weeklyWeatherData={mockWeeklyWeather}
        weeklyWeatherLoading={false}
        weeklyWeatherError={false}
        dataType={DataType.Temperature}
      />
    );

    expect(screen.getByRole('tab', { name: /temp/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /sun/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /precip/i })).toBeInTheDocument();
  });

  it('renders temperature tab as default', () => {
    render(
      <DataChartTabs
        displaySunshineData={mockSunshineData}
        sunshineLoading={false}
        sunshineError={false}
        selectedMonth={1}
        weeklyWeatherData={mockWeeklyWeather}
        weeklyWeatherLoading={false}
        weeklyWeatherError={false}
        dataType={DataType.Temperature}
      />
    );

    const tempTab = screen.getByRole('tab', { name: /temp/i });
    expect(tempTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to sunshine tab when clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataChartTabs
        displaySunshineData={mockSunshineData}
        sunshineLoading={false}
        sunshineError={false}
        selectedMonth={1}
        weeklyWeatherData={mockWeeklyWeather}
        weeklyWeatherLoading={false}
        weeklyWeatherError={false}
        dataType={DataType.Temperature}
      />
    );

    const sunTab = screen.getByRole('tab', { name: /sun/i });
    await user.click(sunTab);

    expect(sunTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to precipitation tab when clicked', async () => {
    const user = userEvent.setup();
    render(
      <DataChartTabs
        displaySunshineData={mockSunshineData}
        sunshineLoading={false}
        sunshineError={false}
        selectedMonth={1}
        weeklyWeatherData={mockWeeklyWeather}
        weeklyWeatherLoading={false}
        weeklyWeatherError={false}
        dataType={DataType.Temperature}
      />
    );

    const precipTab = screen.getByRole('tab', { name: /precip/i });
    await user.click(precipTab);

    expect(precipTab).toHaveAttribute('aria-selected', 'true');
  });

  it('passes loading state to temperature section', () => {
    const { container } = render(
      <DataChartTabs
        displaySunshineData={mockSunshineData}
        sunshineLoading={false}
        sunshineError={false}
        selectedMonth={1}
        weeklyWeatherData={null}
        weeklyWeatherLoading={true}
        weeklyWeatherError={false}
        dataType={DataType.Temperature}
      />
    );

    // temperaturedatasection should show loader component
    expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('passes error state to temperature section', () => {
    render(
      <DataChartTabs
        displaySunshineData={mockSunshineData}
        sunshineLoading={false}
        sunshineError={false}
        selectedMonth={1}
        weeklyWeatherData={null}
        weeklyWeatherLoading={false}
        weeklyWeatherError={true}
        dataType={DataType.Temperature}
      />
    );

    // temperaturedatasection should show error state
    const errorElements = screen.getAllByText(/error|failed/i);
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it('passes loading state to sunshine section', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DataChartTabs
        displaySunshineData={null}
        sunshineLoading={true}
        sunshineError={false}
        selectedMonth={1}
        weeklyWeatherData={mockWeeklyWeather}
        weeklyWeatherLoading={false}
        weeklyWeatherError={false}
        dataType={DataType.Temperature}
      />
    );

    const sunTab = screen.getByRole('tab', { name: /sun/i });
    await user.click(sunTab);

    // sunshinedatasection should show loader component
    expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('passes error state to sunshine section', async () => {
    const user = userEvent.setup();
    render(
      <DataChartTabs
        displaySunshineData={null}
        sunshineLoading={false}
        sunshineError={true}
        selectedMonth={1}
        weeklyWeatherData={mockWeeklyWeather}
        weeklyWeatherLoading={false}
        weeklyWeatherError={false}
        dataType={DataType.Temperature}
      />
    );

    const sunTab = screen.getByRole('tab', { name: /sun/i });
    await user.click(sunTab);

    const errorElements = screen.getAllByText(/error|failed/i);
    expect(errorElements.length).toBeGreaterThan(0);
  });

  it('renders with vertical orientation', () => {
    const { container } = render(
      <DataChartTabs
        displaySunshineData={mockSunshineData}
        sunshineLoading={false}
        sunshineError={false}
        selectedMonth={1}
        weeklyWeatherData={mockWeeklyWeather}
        weeklyWeatherLoading={false}
        weeklyWeatherError={false}
        dataType={DataType.Temperature}
      />
    );

    const tabsContainer = container.querySelector('[role="tablist"]');
    expect(tabsContainer).toHaveAttribute('aria-orientation', 'vertical');
  });
});
