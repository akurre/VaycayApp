import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import SunshineGraphTooltip from '@/components/CityPopup/graphs/SunshineGraphTooltip';

describe('SunshineGraphTooltip', () => {
  const mockPayload = [
    {
      payload: {
        month: 'July',
        monthIndex: 7,
        hours: 280.5,
        theoreticalMax: 350,
        baseline: 200,
      },
    },
  ];

  it('renders tooltip when active with valid payload', () => {
    const { container } = render(
      <SunshineGraphTooltip active={true} payload={mockPayload} />
    );

    expect(screen.getByText('July')).toBeInTheDocument();
    expect(screen.getByText('280.5 hours')).toBeInTheDocument();
    expect(container.querySelector('.bg-white')).toBeInTheDocument();
  });

  it('displays "No data" when hours is null', () => {
    const payloadWithNullHours = [
      {
        payload: {
          month: 'January',
          monthIndex: 1,
          hours: null,
          theoreticalMax: 300,
          baseline: 150,
        },
      },
    ];

    render(
      <SunshineGraphTooltip active={true} payload={payloadWithNullHours} />
    );

    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('returns null when not active', () => {
    const { container } = render(
      <SunshineGraphTooltip active={false} payload={mockPayload} />
    );

    expect(container.querySelector('.bg-white')).not.toBeInTheDocument();
    expect(screen.queryByText('July')).not.toBeInTheDocument();
  });

  it('returns null when payload is not provided', () => {
    const { container } = render(<SunshineGraphTooltip active={true} />);

    expect(container.querySelector('.bg-white')).not.toBeInTheDocument();
  });

  it('returns null when payload is empty array', () => {
    const { container } = render(
      <SunshineGraphTooltip active={true} payload={[]} />
    );

    expect(container.querySelector('.bg-white')).not.toBeInTheDocument();
  });

  it('formats hours with one decimal place', () => {
    const payloadWithPreciseHours = [
      {
        payload: {
          month: 'March',
          monthIndex: 3,
          hours: 123.456789,
          theoreticalMax: 300,
          baseline: 150,
        },
      },
    ];

    render(
      <SunshineGraphTooltip active={true} payload={payloadWithPreciseHours} />
    );

    expect(screen.getByText('123.5 hours')).toBeInTheDocument();
  });
});
