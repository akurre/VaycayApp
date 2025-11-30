import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import RainfallGraphTooltip from '@/components/CityPopup/graphs/RainfallGraphTooltip';

describe('RainfallGraphTooltip', () => {
  const mockPayload = [
    {
      payload: {
        week: 26,
        totalPrecip: 45.8,
        avgPrecip: 6.5,
        compTotalPrecip: null,
        compAvgPrecip: null,
        daysWithRain: 4,
        daysWithData: 7,
      },
    },
  ];

  it('returns null when not active', () => {
    const { container } = render(
      <RainfallGraphTooltip active={false} payload={mockPayload} />
    );
    expect(container.querySelector('div')).not.toBeInTheDocument();
  });

  it('returns null when payload is undefined', () => {
    const { container } = render(<RainfallGraphTooltip active={true} />);
    expect(container.querySelector('div')).not.toBeInTheDocument();
  });

  it('returns null when payload is empty', () => {
    const { container } = render(
      <RainfallGraphTooltip active={true} payload={[]} />
    );
    expect(container.querySelector('div')).not.toBeInTheDocument();
  });

  it('displays precipitation with two decimals', () => {
    render(<RainfallGraphTooltip active={true} payload={mockPayload} />);
    expect(screen.getByText('45.80 mm')).toBeInTheDocument();
  });

  it('displays city badge when cityName is provided', () => {
    render(
      <RainfallGraphTooltip
        active={true}
        payload={mockPayload}
        cityName="Seattle"
      />
    );
    expect(screen.getByText('Seattle')).toBeInTheDocument();
  });

  it('displays comparison city data', () => {
    const comparisonPayload = [
      {
        payload: {
          week: 26,
          totalPrecip: 45.8,
          avgPrecip: 6.5,
          compTotalPrecip: 30.2,
          compAvgPrecip: 4.3,
          daysWithRain: 4,
          daysWithData: 7,
        },
      },
    ];

    render(
      <RainfallGraphTooltip
        active={true}
        payload={comparisonPayload}
        cityName="Seattle"
        comparisonCityName="Portland"
      />
    );
    expect(screen.getByText('Seattle')).toBeInTheDocument();
    expect(screen.getByText('Portland')).toBeInTheDocument();
    expect(screen.getByText('45.80 mm')).toBeInTheDocument();
    expect(screen.getByText('30.20 mm')).toBeInTheDocument();
  });

  it('displays "No data" when totalPrecip is null', () => {
    const noDataPayload = [
      {
        payload: {
          week: 26,
          totalPrecip: null,
          avgPrecip: null,
          compTotalPrecip: null,
          compAvgPrecip: null,
          daysWithRain: 0,
          daysWithData: 7,
        },
      },
    ];

    render(<RainfallGraphTooltip active={true} payload={noDataPayload} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
