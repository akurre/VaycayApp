import { describe, it, expect } from 'vitest';
import { render } from '@/test-utils';
import SunshineGraph from '@/components/CityPopup/graphs/SunshineGraph';
import type { SunshineData } from '@/types/sunshineDataType';

describe('SunshineGraph', () => {
  const mockSunshineData: SunshineData = {
    city: 'Barcelona',
    country: 'Spain',
    lat: 41.3851,
    long: 2.1734,
    population: 1620000,
    stationName: 'Barcelona Airport',
    jan: 149,
    feb: 163,
    mar: 200,
    apr: 220,
    may: 258,
    jun: 285,
    jul: 310,
    aug: 282,
    sep: 219,
    oct: 180,
    nov: 146,
    dec: 138,
  };

  it('renders the sunshine graph component', () => {
    const { container } = render(
      <SunshineGraph sunshineData={mockSunshineData} selectedMonth={7} />
    );

    // should render the responsive container
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders with selected month', () => {
    const { container } = render(
      <SunshineGraph sunshineData={mockSunshineData} selectedMonth={7} />
    );

    // should render the component
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('handles null values in sunshine data correctly', () => {
    const dataWithNulls: SunshineData = {
      ...mockSunshineData,
      jan: null,
      feb: null,
    };

    const { container } = render(
      <SunshineGraph sunshineData={dataWithNulls} selectedMonth={1} />
    );

    // should still render the graph
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders without selected month', () => {
    const { container } = render(
      <SunshineGraph sunshineData={mockSunshineData} />
    );

    // should still render the graph
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders when latitude is available', () => {
    const { container } = render(
      <SunshineGraph sunshineData={mockSunshineData} selectedMonth={7} />
    );

    // should render the component
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders when latitude is null', () => {
    const dataWithoutLat: SunshineData = {
      ...mockSunshineData,
      lat: null,
    };

    const { container } = render(
      <SunshineGraph sunshineData={dataWithoutLat} />
    );

    // should still render the component
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders with all months having data', () => {
    const { container } = render(
      <SunshineGraph sunshineData={mockSunshineData} />
    );

    // should render the component
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });
});
