import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import SunshineGraphTooltip from '@/components/CityPopup/graphs/SunshineGraphTooltip';

describe('SunshineGraphTooltip', () => {
  const mockPayload = [
    {
      payload: {
        month: 'July',
        monthIndex: 7,
        hours: 250.5,
        theoreticalMax: 400,
        baseline: 200,
        comparisonHours: null,
        comparisonTheoreticalMax: null,
      },
    },
  ];

  it('returns null when not active', () => {
    const { container } = render(
      <SunshineGraphTooltip active={false} payload={mockPayload} />
    );
    expect(container.querySelector('div')).not.toBeInTheDocument();
  });

  it('returns null when payload is undefined', () => {
    const { container } = render(<SunshineGraphTooltip active={true} />);
    expect(container.querySelector('div')).not.toBeInTheDocument();
  });

  it('returns null when payload is empty', () => {
    const { container } = render(
      <SunshineGraphTooltip active={true} payload={[]} />
    );
    expect(container.querySelector('div')).not.toBeInTheDocument();
  });

  it('displays month name', () => {
    render(<SunshineGraphTooltip active={true} payload={mockPayload} />);
    expect(screen.getByText('July')).toBeInTheDocument();
  });

  it('displays sunshine hours with one decimal', () => {
    render(<SunshineGraphTooltip active={true} payload={mockPayload} />);
    expect(screen.getByText('250.5 hours')).toBeInTheDocument();
  });

  it('displays city badge when cityName is provided', () => {
    render(
      <SunshineGraphTooltip
        active={true}
        payload={mockPayload}
        cityName="Barcelona"
      />
    );
    expect(screen.getByText('Barcelona')).toBeInTheDocument();
  });

  it('displays comparison city data', () => {
    const comparisonPayload = [
      {
        payload: {
          month: 'July',
          monthIndex: 7,
          hours: 250.5,
          theoreticalMax: 400,
          baseline: 200,
          comparisonHours: 180.3,
          comparisonTheoreticalMax: 350,
        },
      },
    ];

    render(
      <SunshineGraphTooltip
        active={true}
        payload={comparisonPayload}
        cityName="Barcelona"
        comparisonCityName="Madrid"
      />
    );
    expect(screen.getByText('Barcelona')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
    expect(screen.getByText('250.5 hours')).toBeInTheDocument();
    expect(screen.getByText('180.3 hours')).toBeInTheDocument();
  });

  it('displays "No data" when hours is null and no comparison', () => {
    const noDataPayload = [
      {
        payload: {
          month: 'July',
          monthIndex: 7,
          hours: null,
          theoreticalMax: null,
          baseline: 200,
          comparisonHours: null,
          comparisonTheoreticalMax: null,
        },
      },
    ];

    render(<SunshineGraphTooltip active={true} payload={noDataPayload} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('displays comparison data when main city has no data', () => {
    const comparisonOnlyPayload = [
      {
        payload: {
          month: 'July',
          monthIndex: 7,
          hours: null,
          theoreticalMax: null,
          baseline: 200,
          comparisonHours: 220.7,
          comparisonTheoreticalMax: 400,
        },
      },
    ];

    render(
      <SunshineGraphTooltip
        active={true}
        payload={comparisonOnlyPayload}
        comparisonCityName="Valencia"
      />
    );
    expect(screen.getByText('220.7 hours')).toBeInTheDocument();
    expect(screen.getByText('Valencia')).toBeInTheDocument();
  });
});
