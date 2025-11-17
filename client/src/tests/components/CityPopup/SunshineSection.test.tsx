import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import SunshineSection from '@/components/CityPopup/SunshineSection';
import { SunshineData } from '@/types/sunshineDataType';

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

  it('renders the selected month sunshine hours', () => {
    render(<SunshineSection sunshineData={mockSunshineData} selectedMonth={7} />);

    // July is month 7, should show 310 hours
    expect(screen.getByText('July Sunshine')).toBeInTheDocument();
    expect(screen.getByText('310.0 hours')).toBeInTheDocument();
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

  it('handles null values in sunshine data', () => {
    const dataWithNulls: SunshineData = {
      ...mockSunshineData,
      jan: null,
      feb: null,
    };

    render(<SunshineSection sunshineData={dataWithNulls} selectedMonth={1} />);

    // January is null, should show "No data"
    expect(screen.getByText('January Sunshine')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();

    // Average should exclude null values
    const avgSunshine = (200 + 220 + 258 + 285 + 310 + 282 + 219 + 180 + 146 + 138) / 10;
    const formattedAvg = `${avgSunshine.toFixed(1)} hours`;

    expect(screen.getByText('Average Annual Sunshine')).toBeInTheDocument();
    expect(screen.getByText(formattedAvg)).toBeInTheDocument();
  });

  it('does not render month section when selectedMonth is not provided', () => {
    render(<SunshineSection sunshineData={mockSunshineData} />);

    // Should not show any month-specific data
    const monthLabels = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    for (const month of monthLabels) {
      expect(screen.queryByText(`${month} Sunshine`)).not.toBeInTheDocument();
    }

    // But should still show average
    expect(screen.getByText('Average Annual Sunshine')).toBeInTheDocument();
  });
});
