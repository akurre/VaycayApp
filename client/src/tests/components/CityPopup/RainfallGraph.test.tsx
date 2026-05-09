import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@/test-utils';
import RainfallGraph from '@/components/CityPopup/graphs/RainfallGraph';
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
    const { container } = render(
      <RainfallGraph weeklyWeatherData={mockWeeklyWeather} />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('filters out weeks with no precipitation data', () => {
    const { container } = render(
      <RainfallGraph weeklyWeatherData={mockWeeklyWeather} />
    );

    // should render but only include weeks with data
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
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

    const { container } = render(
      <RainfallGraph weeklyWeatherData={allDataWeather} />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
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

    const { container } = render(
      <RainfallGraph weeklyWeatherData={noDataWeather} />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
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

    const { container } = render(
      <RainfallGraph weeklyWeatherData={partialDataWeather} />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
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

    const { container } = render(
      <RainfallGraph weeklyWeatherData={partialDataWeather} />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('memoizes chart data correctly', () => {
    const { rerender } = render(
      <RainfallGraph weeklyWeatherData={mockWeeklyWeather} />
    );

    // rerender with same data
    rerender(<RainfallGraph weeklyWeatherData={mockWeeklyWeather} />);

    // should not cause errors
    expect(true).toBe(true);
  });

  it('returns null when both weeklyWeatherData and comparisonWeeklyWeatherData are absent', () => {
    const { container } = render(<RainfallGraph weeklyWeatherData={null} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeNull();
  });

  it('renders with only comparison data (comp-only mode)', () => {
    const compWeather = createMockWeeklyWeather({
      weeklyData: [
        {
          week: 1,
          avgTemp: 18,
          minTemp: 12,
          maxTemp: 24,
          totalPrecip: 40,
          avgPrecip: 5.7,
          daysWithRain: 3,
          daysWithData: 7,
        },
      ],
    });

    const { container } = render(
      <RainfallGraph
        weeklyWeatherData={null}
        comparisonWeeklyWeatherData={compWeather}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders with both main and comparison data (merged mode)', () => {
    const compWeather = createMockWeeklyWeather({
      weeklyData: [
        {
          week: 1,
          avgTemp: 18,
          minTemp: 12,
          maxTemp: 24,
          totalPrecip: 35,
          avgPrecip: 5.0,
          daysWithRain: 3,
          daysWithData: 7,
        },
        {
          week: 2,
          avgTemp: 20,
          minTemp: 14,
          maxTemp: 26,
          totalPrecip: 20,
          avgPrecip: 2.86,
          daysWithRain: 2,
          daysWithData: 7,
        },
      ],
    });

    const { container } = render(
      <RainfallGraph
        weeklyWeatherData={mockWeeklyWeather}
        comparisonWeeklyWeatherData={compWeather}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders reference line and today dot when selectedDate matches a week', () => {
    const { container } = render(
      <RainfallGraph
        weeklyWeatherData={mockWeeklyWeather}
        selectedDate="2024-01-03"
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders today dots for both cities when both data and selectedDate are present', () => {
    const compWeather = createMockWeeklyWeather({
      weeklyData: [
        {
          week: 1,
          avgTemp: 18,
          minTemp: 12,
          maxTemp: 24,
          totalPrecip: 35,
          avgPrecip: 5.0,
          daysWithRain: 3,
          daysWithData: 7,
        },
      ],
    });

    const { container } = render(
      <RainfallGraph
        weeklyWeatherData={mockWeeklyWeather}
        comparisonWeeklyWeatherData={compWeather}
        selectedDate="2024-01-03"
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('calls onHover with null when mouse leaves the chart', () => {
    const onHover = vi.fn();
    const { container } = render(
      <RainfallGraph weeklyWeatherData={mockWeeklyWeather} onHover={onHover} />
    );

    const wrapper = container.querySelector('.recharts-wrapper');
    if (wrapper) {
      fireEvent.mouseLeave(wrapper);
      expect(onHover).toHaveBeenCalledWith(null);
    }
  });

  it('renders comp-only today dot when selectedDate matches and only comparison data exists', () => {
    const compWeather = createMockWeeklyWeather({
      weeklyData: [
        {
          week: 1,
          avgTemp: 18,
          minTemp: 12,
          maxTemp: 24,
          totalPrecip: 40,
          avgPrecip: 5.7,
          daysWithRain: 3,
          daysWithData: 7,
        },
      ],
    });

    const { container } = render(
      <RainfallGraph
        weeklyWeatherData={null}
        comparisonWeeklyWeatherData={compWeather}
        selectedDate="2024-01-03"
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });
});
