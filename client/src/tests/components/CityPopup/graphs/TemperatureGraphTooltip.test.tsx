import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import TemperatureGraphTooltip from '@/components/CityPopup/graphs/TemperatureGraphTooltip';

describe('TemperatureGraphTooltip', () => {
  const mockPayload = [
    {
      payload: {
        week: 30,
        avgTemp: 22.5,
        maxTemp: 28.3,
        minTemp: 16.7,
        compAvgTemp: null,
        compMaxTemp: null,
        compMinTemp: null,
        daysWithData: 7,
      },
    },
  ];

  it('returns null when not active', () => {
    const { container } = render(
      <TemperatureGraphTooltip active={false} payload={mockPayload} />
    );
    expect(container.querySelector('div')).not.toBeInTheDocument();
  });

  it('returns null when payload is undefined', () => {
    const { container } = render(<TemperatureGraphTooltip active={true} />);
    expect(container.querySelector('div')).not.toBeInTheDocument();
  });

  it('returns null when payload is empty', () => {
    const { container } = render(
      <TemperatureGraphTooltip active={true} payload={[]} />
    );
    expect(container.querySelector('div')).not.toBeInTheDocument();
  });

  it('displays all temperature values with one decimal', () => {
    render(<TemperatureGraphTooltip active={true} payload={mockPayload} />);
    expect(screen.getByText('Max: 28.3°C')).toBeInTheDocument();
    expect(screen.getByText('Avg: 22.5°C')).toBeInTheDocument();
    expect(screen.getByText('Min: 16.7°C')).toBeInTheDocument();
  });

  it('displays city badge when cityName is provided', () => {
    render(
      <TemperatureGraphTooltip
        active={true}
        payload={mockPayload}
        cityName="Paris"
      />
    );
    expect(screen.getByText('Paris')).toBeInTheDocument();
  });

  it('displays comparison city data', () => {
    const comparisonPayload = [
      {
        payload: {
          week: 30,
          avgTemp: 22.5,
          maxTemp: 28.3,
          minTemp: 16.7,
          compAvgTemp: 20.1,
          compMaxTemp: 25.4,
          compMinTemp: 14.8,
          daysWithData: 7,
        },
      },
    ];

    render(
      <TemperatureGraphTooltip
        active={true}
        payload={comparisonPayload}
        cityName="Paris"
        comparisonCityName="London"
      />
    );
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Max: 28.3°C')).toBeInTheDocument();
    expect(screen.getByText('Max: 25.4°C')).toBeInTheDocument();
  });

  it('displays "No data" when all temperatures are null', () => {
    const noDataPayload = [
      {
        payload: {
          week: 30,
          avgTemp: null,
          maxTemp: null,
          minTemp: null,
          compAvgTemp: null,
          compMaxTemp: null,
          compMinTemp: null,
          daysWithData: 0,
        },
      },
    ];

    render(<TemperatureGraphTooltip active={true} payload={noDataPayload} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('displays partial temperature data', () => {
    const partialPayload = [
      {
        payload: {
          week: 30,
          avgTemp: 22.5,
          maxTemp: null,
          minTemp: 16.7,
          compAvgTemp: null,
          compMaxTemp: null,
          compMinTemp: null,
          daysWithData: 7,
        },
      },
    ];

    render(<TemperatureGraphTooltip active={true} payload={partialPayload} />);
    expect(screen.getByText('Avg: 22.5°C')).toBeInTheDocument();
    expect(screen.getByText('Min: 16.7°C')).toBeInTheDocument();
    expect(screen.queryByText(/Max:/)).not.toBeInTheDocument();
  });

  it('displays comparison data when main city has no data', () => {
    const comparisonOnlyPayload = [
      {
        payload: {
          week: 30,
          avgTemp: null,
          maxTemp: null,
          minTemp: null,
          compAvgTemp: 18.5,
          compMaxTemp: 23.2,
          compMinTemp: 13.8,
          daysWithData: 7,
        },
      },
    ];

    render(
      <TemperatureGraphTooltip
        active={true}
        payload={comparisonOnlyPayload}
        comparisonCityName="Berlin"
      />
    );
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('Max: 23.2°C')).toBeInTheDocument();
    expect(screen.getByText('Avg: 18.5°C')).toBeInTheDocument();
    expect(screen.getByText('Min: 13.8°C')).toBeInTheDocument();
  });
});
