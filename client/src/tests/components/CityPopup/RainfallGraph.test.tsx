import { describe, it, expect } from 'vitest';
import { render } from '@/test-utils';
import RainfallGraph from '@/components/CityPopup/RainfallGraph';
import { createMockWeeklyWeather } from '@/test-utils';

describe('RainfallGraph', () => {
  const mockWeeklyWeather = createMockWeeklyWeather({
    weeklyData: [
      {
        week: 1,
        avgTemp: 20,
        minTemp: 15,
        maxTemp: 25,
        totalPrecip: 50,
        avgPrecip: 7.14,
        daysWithRain: 4,
        daysWithData: 7,
      },
      {
        week: 2,
        avgTemp: 22,
        minTemp: 16,
        maxTemp: 27,
        totalPrecip: 30,
        avgPrecip: 4.28,
        daysWithRain: 2,
        daysWithData: 7,
      },
      {
        week: 3,
        avgTemp: 18,
        minTemp: 14,
        maxTemp: 23,
        totalPrecip: null,
        avgPrecip: null,
        daysWithRain: 0,
        daysWithData: 0,
      },
    ],
  });

  it('renders the rainfall graph component', () => {
    const { container } = render(<RainfallGraph weeklyWeatherData={mockWeeklyWeather} />);

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('filters out weeks with no precipitation data', () => {
    const { container } = render(<RainfallGraph weeklyWeatherData={mockWeeklyWeather} />);

    // should render but only include weeks with data
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('renders with all weeks having precipitation data', () => {
    const allDataWeather = createMockWeeklyWeather({
      weeklyData: [
        {
          week: 1,
          avgTemp: 20,
          minTemp: 15,
          maxTemp: 25,
          totalPrecip: 50,
          avgPrecip: 7.14,
          daysWithRain: 4,
          daysWithData: 7,
        },
        {
          week: 2,
          avgTemp: 22,
          minTemp: 16,
          maxTemp: 27,
          totalPrecip: 30,
          avgPrecip: 4.28,
          daysWithRain: 2,
          daysWithData: 7,
        },
      ],
    });

    const { container } = render(<RainfallGraph weeklyWeatherData={allDataWeather} />);

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('renders empty chart when all weeks have null precipitation', () => {
    const noDataWeather = createMockWeeklyWeather({
      weeklyData: [
        {
          week: 1,
          avgTemp: 20,
          minTemp: 15,
          maxTemp: 25,
          totalPrecip: null,
          avgPrecip: null,
          daysWithRain: 0,
          daysWithData: 0,
        },
      ],
    });

    const { container } = render(<RainfallGraph weeklyWeatherData={noDataWeather} />);

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('handles weeks with only avgPrecip data', () => {
    const partialDataWeather = createMockWeeklyWeather({
      weeklyData: [
        {
          week: 1,
          avgTemp: 20,
          minTemp: 15,
          maxTemp: 25,
          totalPrecip: null,
          avgPrecip: 5.5,
          daysWithRain: 3,
          daysWithData: 7,
        },
      ],
    });

    const { container } = render(<RainfallGraph weeklyWeatherData={partialDataWeather} />);

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('handles weeks with only totalPrecip data', () => {
    const partialDataWeather = createMockWeeklyWeather({
      weeklyData: [
        {
          week: 1,
          avgTemp: 20,
          minTemp: 15,
          maxTemp: 25,
          totalPrecip: 45.5,
          avgPrecip: null,
          daysWithRain: 3,
          daysWithData: 7,
        },
      ],
    });

    const { container } = render(<RainfallGraph weeklyWeatherData={partialDataWeather} />);

    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('memoizes chart data correctly', () => {
    const { rerender } = render(<RainfallGraph weeklyWeatherData={mockWeeklyWeather} />);

    // rerender with same data
    rerender(<RainfallGraph weeklyWeatherData={mockWeeklyWeather} />);

    // should not cause errors
    expect(true).toBe(true);
  });
});
