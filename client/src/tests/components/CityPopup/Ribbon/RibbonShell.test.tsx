import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import RibbonShell from '@/components/CityPopup/Ribbon/RibbonShell';
import { DataType } from '@/types/mapTypes';
import type { RibbonStat } from '@/types/cityPopupTypes';
import type { SearchCitiesResult } from '@/types/userLocationType';

const STATS: RibbonStat[] = [
  { label: 'Sun / yr', v1: '1820h', v2: '—' },
  { label: 'Rain / yr', v1: '600mm', v2: '—' },
  { label: 'Today range', v1: '5°C–17°C', v2: '—' },
  { label: 'Avg today', v1: '11°C', v2: '—' },
  { label: 'Population', v1: '3.5M', v2: '—' },
];

const baseProps = {
  baseCityName: 'Berlin',
  baseCityLat: 52.5,
  comparisonCity: null,
  initialTab: DataType.Temperature,
  todayC1: 12.9,
  todayC2: null,
  selectedDate: '2026-05-06',
  stats: STATS,
  renderChart: () => <div data-testid="chart-slot">chart</div>,
};

describe('RibbonShell', () => {
  it('renders the city name, today readout, chart slot, month labels, tabs, and stats', () => {
    render(<RibbonShell {...baseProps} />);

    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('12.9°C')).toBeInTheDocument();
    expect(screen.getByTestId('chart-slot')).toBeInTheDocument();
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /temp/i })).toBeInTheDocument();
    expect(screen.getByText('Sun / yr')).toBeInTheDocument();
  });

  it('switches the active tab when a tab button is clicked', () => {
    render(<RibbonShell {...baseProps} initialTab={DataType.Temperature} />);

    fireEvent.click(screen.getByRole('button', { name: /precip/i }));
    expect(screen.getByRole('button', { name: /precip/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('forwards a stable onHover into renderChart and updates the readout when called', () => {
    const renderChart = vi.fn(
      (
        _tab: DataType,
        onHover: (payload: { label: string; v1: string | null; v2: string | null } | null) => void
      ) => (
        <button
          type="button"
          data-testid="emit-hover"
          onClick={() =>
            onHover({ label: 'Week 22', v1: '14.0°C', v2: null })
          }
        >
          emit
        </button>
      )
    );
    render(<RibbonShell {...baseProps} renderChart={renderChart} />);

    fireEvent.click(screen.getByTestId('emit-hover'));
    expect(screen.getByText('Week 22')).toBeInTheDocument();
    expect(screen.getByText('14.0°C')).toBeInTheDocument();
    // onHover identity should be stable across renders (useCallback) — verify by
    // capturing first arg from first render and comparing to subsequent render
    const firstHoverFn = renderChart.mock.calls[0][1];
    const lastHoverFn =
      renderChart.mock.calls[renderChart.mock.calls.length - 1][1];
    expect(firstHoverFn).toBe(lastHoverFn);
  });

  it('shows comparison row only when comparisonCity is provided', () => {
    const comparisonCity: SearchCitiesResult = {
      id: 2,
      name: 'Birmingham',
      country: 'UK',
      state: null,
      lat: 33.5,
      long: -86.8,
      population: 200_000,
    };
    render(
      <RibbonShell
        {...baseProps}
        comparisonCity={comparisonCity}
        todayC2={17.6}
      />
    );
    expect(screen.getByText('Birmingham')).toBeInTheDocument();
    expect(screen.getByText('17.6°C')).toBeInTheDocument();
  });
});
