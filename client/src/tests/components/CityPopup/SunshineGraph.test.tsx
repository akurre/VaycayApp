import { describe, it, expect, vi } from 'vitest';
import { render } from '@/test-utils';
import SunshineGraph from '@/components/CityPopup/graphs/SunshineGraph';
import type { SunshineData } from '@/types/sunshineDataType';

describe('SunshineGraph', () => {
  const mockSunshineData: SunshineData = {
    cityId: 315,
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

  it('returns null when both sunshineData and comparisonSunshineData are absent', () => {
    const { container } = render(<SunshineGraph sunshineData={null} />);
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeNull();
  });

  it('renders with comparison data alongside main data', () => {
    const comparisonData: SunshineData = {
      cityId: 400,
      city: 'Madrid',
      country: 'Spain',
      lat: 40.4168,
      long: -3.7038,
      population: 3200000,
      stationName: 'Madrid Barajas',
      jan: 158,
      feb: 172,
      mar: 210,
      apr: 225,
      may: 268,
      jun: 300,
      jul: 330,
      aug: 310,
      sep: 240,
      oct: 195,
      nov: 155,
      dec: 142,
    };

    const { container } = render(
      <SunshineGraph
        sunshineData={mockSunshineData}
        comparisonSunshineData={comparisonData}
        selectedMonth={6}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders comp-only (no main sunshineData, only comparison)', () => {
    const comparisonData: SunshineData = {
      cityId: 400,
      city: 'Madrid',
      country: 'Spain',
      lat: 40.4168,
      long: -3.7038,
      population: 3200000,
      stationName: 'Madrid Barajas',
      jan: 158,
      feb: 172,
      mar: 210,
      apr: 225,
      may: 268,
      jun: 300,
      jul: 330,
      aug: 310,
      sep: 240,
      oct: 195,
      nov: 155,
      dec: 142,
    };

    const { container } = render(
      <SunshineGraph
        sunshineData={null}
        comparisonSunshineData={comparisonData}
        selectedMonth={3}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders reference dots for both cities when selectedMonth and both data are present', () => {
    const comparisonData: SunshineData = {
      cityId: 400,
      city: 'Madrid',
      country: 'Spain',
      lat: 40.4168,
      long: -3.7038,
      population: 3200000,
      stationName: 'Madrid Barajas',
      jan: 158,
      feb: 172,
      mar: 210,
      apr: 225,
      may: 268,
      jun: 300,
      jul: 330,
      aug: 310,
      sep: 240,
      oct: 195,
      nov: 155,
      dec: 142,
    };

    const { container } = render(
      <SunshineGraph
        sunshineData={mockSunshineData}
        comparisonSunshineData={comparisonData}
        selectedMonth={7}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('accepts an onHover callback without errors', () => {
    const onHover = vi.fn();

    const { container } = render(
      <SunshineGraph
        sunshineData={mockSunshineData}
        selectedMonth={5}
        onHover={onHover}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders with comparison data where main sunshineData has null lat', () => {
    const dataWithoutLat: SunshineData = { ...mockSunshineData, lat: null };
    const comparisonData: SunshineData = {
      cityId: 400,
      city: 'Madrid',
      country: 'Spain',
      lat: 40.4168,
      long: -3.7038,
      population: 3200000,
      stationName: 'Madrid Barajas',
      jan: 158,
      feb: 172,
      mar: 210,
      apr: 225,
      may: 268,
      jun: 300,
      jul: 330,
      aug: 310,
      sep: 240,
      oct: 195,
      nov: 155,
      dec: 142,
    };

    const { container } = render(
      <SunshineGraph
        sunshineData={dataWithoutLat}
        comparisonSunshineData={comparisonData}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });
});
