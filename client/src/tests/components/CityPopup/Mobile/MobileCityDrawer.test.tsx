import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { render, screen, fireEvent } from '@/test-utils';
import MobileCityDrawer from '@/components/CityPopup/Mobile/MobileCityDrawer';
import { useAppStore } from '@/stores/useAppStore';
import { DataType } from '@/types/mapTypes';
import type { WeatherData } from '@/types/cityWeatherDataType';
import {
  MOBILE_DRAWER_DISMISS_DRAG_FRACTION,
  MOBILE_DRAWER_DRAG_HANDLE_W_PX,
  MOBILE_DRAWER_DRAG_HANDLE_H_PX,
} from '@/const';

vi.mock('@/api/dates/useWeatherDataForCity', () => ({
  default: vi.fn(),
}));

vi.mock('@/api/dates/useSunshineDataForCity', () => ({
  default: vi.fn(),
}));

vi.mock('@/api/dates/useWeeklyWeatherForCity', () => ({
  default: vi.fn(),
}));

vi.mock('@/components/CityPopup/DataChartTabs', () => ({
  default: ({ tab }: { tab: DataType }) => (
    <div data-testid="data-chart-tabs">tab:{tab}</div>
  ),
}));

import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';
import useWeeklyWeatherForCity from '@/api/dates/useWeeklyWeatherForCity';

const weatherCity: WeatherData = {
  cityId: 235,
  city: 'New York',
  country: 'United States',
  state: 'New York',
  suburb: null,
  date: '2020-01-15',
  lat: 40.7128,
  long: -74.006,
  population: 8_419_000,
  precipitation: 10,
  snowDepth: 5,
  avgTemperature: 5,
  maxTemperature: 10,
  minTemperature: 0,
  stationName: 'NYC Station',
  submitterId: null,
};

describe('MobileCityDrawer', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    useAppStore.setState({ isCityDrawerOpen: false });

    vi.mocked(useWeatherDataForCity).mockReturnValue({
      weatherData: null,
      weatherLoading: false,
      weatherError: false,
    });
    vi.mocked(useSunshineDataForCity).mockReturnValue({
      sunshineData: null,
      sunshineLoading: false,
      sunshineError: false,
    });
    vi.mocked(useWeeklyWeatherForCity).mockReturnValue({
      weeklyWeatherData: null,
      loading: false,
      error: false,
    });
  });

  it('renders the drawer root with mobile-specific test id', () => {
    render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    expect(screen.getByTestId('mobile-city-drawer')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-tab-bar')).toBeInTheDocument();
  });

  it('does NOT render the desktop stat-rail', () => {
    render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    expect(screen.queryByTestId('stat-rail')).toBeNull();
  });

  it('flips useAppStore.isCityDrawerOpen on mount and back on unmount', () => {
    const { unmount } = render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    expect(useAppStore.getState().isCityDrawerOpen).toBe(true);
    unmount();
    expect(useAppStore.getState().isCityDrawerOpen).toBe(false);
  });

  it('renders the city name in the header', () => {
    render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    expect(
      screen.getByText('New York, New York, United States')
    ).toBeInTheDocument();
  });

  it('renders the X close button as a11y fallback and calls onClose when tapped', () => {
    render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders a "+ Compare" affordance when no comparison city is set', () => {
    render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    expect(screen.getByLabelText('Add comparison city')).toBeInTheDocument();
  });

  it('renders the drag handle pill at the configured dimensions', () => {
    render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    const region = screen.getByTestId('mobile-drawer-drag-region');
    const pill = region.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(pill).toBeTruthy();
    expect(pill.style.width).toBe(`${MOBILE_DRAWER_DRAG_HANDLE_W_PX}px`);
    expect(pill.style.height).toBe(`${MOBILE_DRAWER_DRAG_HANDLE_H_PX}px`);
  });

  it('starts on the temperature tab when dataType is Temperature', () => {
    render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    expect(screen.getByText('tab:temperature')).toBeInTheDocument();
  });

  it('switches to the Details tab and hides the chart when Details is tapped', () => {
    render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.queryByTestId('data-chart-tabs')).toBeNull();
    expect(screen.getByTestId('mobile-details-list')).toBeInTheDocument();
  });

  it('renders all five Details cards when Details is active', () => {
    render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    expect(screen.getByText('Sun / yr')).toBeInTheDocument();
    expect(screen.getByText('Rain / yr')).toBeInTheDocument();
    expect(screen.getByText("This day's range")).toBeInTheDocument();
    expect(screen.getByText('From home')).toBeInTheDocument();
    expect(screen.getByText('Population')).toBeInTheDocument();
  });

  it('snaps back when drag distance is below the dismiss threshold', () => {
    const { container } = render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    const drawer = screen.getByTestId('mobile-city-drawer');
    const region = screen.getByTestId('mobile-drawer-drag-region');

    Object.defineProperty(drawer, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        height: 380,
        top: 0,
        bottom: 380,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });

    fireEvent.pointerDown(region, { pointerId: 1, clientY: 0 });
    fireEvent.pointerMove(region, { pointerId: 1, clientY: 50 });
    expect(drawer.style.transform).toBe('translateY(50px)');

    fireEvent.pointerUp(region, { pointerId: 1, clientY: 50 });
    expect(drawer.style.transform).toBe('translateY(0)');
    expect(onClose).not.toHaveBeenCalled();

    expect(container).toBeTruthy();
  });

  it('dismisses when drag distance exceeds the dismiss fraction threshold', async () => {
    vi.useFakeTimers();
    render(
      <MobileCityDrawer
        city={weatherCity}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    const drawer = screen.getByTestId('mobile-city-drawer');
    const region = screen.getByTestId('mobile-drawer-drag-region');

    Object.defineProperty(drawer, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        height: 380,
        top: 0,
        bottom: 380,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });

    const beyondThreshold = 380 * MOBILE_DRAWER_DISMISS_DRAG_FRACTION + 20;

    fireEvent.pointerDown(region, { pointerId: 1, clientY: 0 });
    fireEvent.pointerMove(region, { pointerId: 1, clientY: beyondThreshold });
    fireEvent.pointerUp(region, { pointerId: 1, clientY: beyondThreshold });

    expect(drawer.style.transform).toBe('translateY(100%)');

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('returns null when no city is provided', () => {
    const { container } = render(
      <MobileCityDrawer
        city={null}
        onClose={onClose}
        selectedMonth={1}
        selectedDate="01-15"
        dataType={DataType.Temperature}
      />
    );

    expect(container.querySelector('[data-testid="mobile-city-drawer"]')).toBeNull();
  });
});
