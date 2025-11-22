import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import SunshineSection from '@/components/CityPopup/SunshineSection';
import type { SunshineData } from '@/types/sunshineDataType';

describe('SunshineSection', () => {
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
    render(<SunshineSection sunshineData={mockSunshineData} selectedMonth={7} />);

    // Should render the section title
    expect(screen.getByText('Sunshine')).toBeInTheDocument();
  });

  it('renders the average annual sunshine', () => {
    render(<SunshineSection sunshineData={mockSunshineData} selectedMonth={1} />);

    // Average of all months
    const avgSunshine =
      (149 + 163 + 200 + 220 + 258 + 285 + 310 + 282 + 219 + 180 + 146 + 138) / 12;
    const formattedAvg = `${avgSunshine.toFixed(1)} hours`;

    expect(screen.getByText('Average Annual Sunshine')).toBeInTheDocument();
    expect(screen.getByText(formattedAvg)).toBeInTheDocument();
  });

  it('handles null values in sunshine data correctly', () => {
    const dataWithNulls: SunshineData = {
      ...mockSunshineData,
      jan: null,
      feb: null,
    };

    render(<SunshineSection sunshineData={dataWithNulls} selectedMonth={1} />);

    // Average should exclude null values
    const avgSunshine = (200 + 220 + 258 + 285 + 310 + 282 + 219 + 180 + 146 + 138) / 10;
    const formattedAvg = `${avgSunshine.toFixed(1)} hours`;

    expect(screen.getByText('Average Annual Sunshine')).toBeInTheDocument();
    expect(screen.getByText(formattedAvg)).toBeInTheDocument();
  });

  it('renders without selected month', () => {
    render(<SunshineSection sunshineData={mockSunshineData} />);

    // Should still show average
    expect(screen.getByText('Average Annual Sunshine')).toBeInTheDocument();
  });
});
