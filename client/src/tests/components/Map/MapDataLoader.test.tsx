import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import MapDataLoader from '@/components/Map/MapDataLoader';
import { useAppStore } from '@/stores/useAppStore';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useSunshineStore } from '@/stores/useSunshineStore';
import { DataType } from '@/types/mapTypes';

describe('MapDataLoader', () => {
  beforeEach(() => {
    useAppStore.setState({ isGesturing: false });
    useWeatherStore.setState({ isLoadingWeather: false });
    useSunshineStore.setState({ isLoadingSunshine: false });
  });

  it('renders the spinner when the user is gesturing', () => {
    useAppStore.setState({ isGesturing: true });
    render(<MapDataLoader dataType={DataType.Temperature} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the spinner when weather is loading and dataType is Temperature', () => {
    useWeatherStore.setState({ isLoadingWeather: true });
    render(<MapDataLoader dataType={DataType.Temperature} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the spinner when sunshine is loading and dataType is Sunshine', () => {
    useSunshineStore.setState({ isLoadingSunshine: true });
    render(<MapDataLoader dataType={DataType.Sunshine} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('ignores the off-tab loading flag — sunshine loading is invisible on the Temperature tab', () => {
    useSunshineStore.setState({ isLoadingSunshine: true });
    render(<MapDataLoader dataType={DataType.Temperature} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('ignores the off-tab loading flag — weather loading is invisible on the Sunshine tab', () => {
    useWeatherStore.setState({ isLoadingWeather: true });
    render(<MapDataLoader dataType={DataType.Sunshine} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not render the spinner when neither gesturing nor loading', () => {
    render(<MapDataLoader dataType={DataType.Temperature} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('exposes an aria-label so screen readers announce the loading state', () => {
    useAppStore.setState({ isGesturing: true });
    render(<MapDataLoader dataType={DataType.Temperature} />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Loading map data'
    );
  });
});
