import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import RibbonShell from '@/components/CityPopup/Ribbon/RibbonShell';
import { DataType } from '@/types/mapTypes';
import type { RibbonStat, TodayValuesByTab } from '@/types/cityPopupTypes';
import type { SearchCitiesResult } from '@/types/userLocationType';

const STATS: RibbonStat[] = [
  { label: 'Sun / yr', v1: '1820h', v2: '—' },
  { label: 'Rain / yr', v1: '600mm', v2: '—' },
  { label: 'Today range', v1: '5°C–17°C', v2: '—' },
  { label: 'Avg today', v1: '11°C', v2: '—' },
  { label: 'Population', v1: '3.5M', v2: '—' },
];

const buildTodayValues = (
  overrides: Partial<TodayValuesByTab> = {}
): TodayValuesByTab => ({
  [DataType.Temperature]: { c1: 12.9, c2: null },
  [DataType.Sunshine]: { c1: null, c2: null },
  [DataType.Precip]: { c1: null, c2: null },
  ...overrides,
});

const baseProps = {
  baseCityName: 'Berlin',
  baseCityLat: 52.5,
  comparisonCity: null,
  initialTab: DataType.Temperature,
  todayValuesByTab: buildTodayValues(),
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

  it('shows the per-tab today value after switching tabs (sunshine → % sun, precip → mm + rainy days)', () => {
    render(
      <RibbonShell
        {...baseProps}
        todayValuesByTab={buildTodayValues({
          [DataType.Sunshine]: { c1: 42.7, c2: null },
          [DataType.Precip]: { c1: 18, c2: null, subC1: 3, subC2: null },
        })}
      />
    );

    expect(screen.getByText('12.9°C')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sun/i }));
    expect(screen.getByText('43% sun')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /precip/i }));
    expect(screen.getByText('18mm')).toBeInTheDocument();
    expect(screen.getByText('3 rainy days')).toBeInTheDocument();
  });

  it('forwards a stable onHover into renderChart and updates the readout when called', () => {
    const renderChart = vi.fn(
      (
        _tab: DataType,
        onHover: (
          payload: {
            label: string;
            v1: string | null;
            v2: string | null;
          } | null
        ) => void
      ) => (
        <button
          type="button"
          data-testid="emit-hover"
          onClick={() => onHover({ label: 'Week 22', v1: '14.0°C', v2: null })}
        >
          emit
        </button>
      )
    );
    render(<RibbonShell {...baseProps} renderChart={renderChart} />);

    fireEvent.click(screen.getByTestId('emit-hover'));
    expect(screen.getByText('Week 22')).toBeInTheDocument();
    expect(screen.getByText('14.0°C')).toBeInTheDocument();
    const firstHoverFn = renderChart.mock.calls[0][1];
    const lastHoverFn =
      renderChart.mock.calls[renderChart.mock.calls.length - 1][1];
    expect(firstHoverFn).toBe(lastHoverFn);
  });

  it('hides tabs not in availableTabs and falls back to the first available tab', () => {
    const renderChart = vi.fn(
      (
        _tab: DataType,
        _onHover: (
          payload: {
            label: string;
            v1: string | null;
            v2: string | null;
          } | null
        ) => void
      ) => <div data-testid="chart-slot">chart</div>
    );
    render(
      <RibbonShell
        {...baseProps}
        initialTab={DataType.Sunshine}
        availableTabs={[DataType.Temperature, DataType.Precip]}
        renderChart={renderChart}
      />
    );

    expect(screen.queryByRole('button', { name: /sun/i })).toBeNull();
    expect(screen.getByRole('button', { name: /temp/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(renderChart.mock.calls[0][0]).toBe(DataType.Temperature);
  });

  it('renders the active tab note from notesByTab next to the tabs', () => {
    render(
      <RibbonShell
        {...baseProps}
        initialTab={DataType.Sunshine}
        availableTabs={[
          DataType.Temperature,
          DataType.Sunshine,
          DataType.Precip,
        ]}
        notesByTab={{
          [DataType.Sunshine]: (
            <span data-testid="sun-note">No sunshine data for Berlin</span>
          ),
        }}
      />
    );

    expect(screen.getByTestId('sun-note')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /temp/i }));
    expect(screen.queryByTestId('sun-note')).toBeNull();
  });

  it('updates the active tab when initialTab changes (e.g. MapDataToggle flips)', () => {
    const { rerender } = render(
      <RibbonShell {...baseProps} initialTab={DataType.Temperature} />
    );

    expect(screen.getByRole('button', { name: /temp/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    rerender(<RibbonShell {...baseProps} initialTab={DataType.Sunshine} />);

    expect(screen.getByRole('button', { name: /sun/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
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
        comparisonNode={<div>Birmingham, UK</div>}
        todayValuesByTab={buildTodayValues({
          [DataType.Temperature]: { c1: 12.9, c2: 17.6 },
        })}
      />
    );
    expect(screen.getByText(/Birmingham/)).toBeInTheDocument();
    expect(screen.getByText('17.6°C')).toBeInTheDocument();
  });
});
