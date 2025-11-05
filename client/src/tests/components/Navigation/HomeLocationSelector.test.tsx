import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import HomeLocationSelector from '@/components/Navigation/HomeLocationSelector';
import { useAppStore } from '@/stores/useAppStore';
import { LocationSource } from '@/types/userLocationType';

// mock the hooks
vi.mock('@/hooks/useUserLocation', () => ({
  useUserLocation: () => ({
    requestLocation: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/hooks/useCitySearch', () => ({
  default: () => ({
    searchCities: vi.fn().mockResolvedValue([]),
    selectCity: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

describe('HomeLocationSelector', () => {
  beforeEach(() => {
    // reset store before each test
    useAppStore.setState({
      homeLocation: null,
      isLocationLoading: false,
      locationError: null,
    });
  });

  it('renders with default text when no home location is set', () => {
    render(<HomeLocationSelector />);
    expect(screen.getByText('Set Home Location')).toBeInTheDocument();
  });

  it('displays home location when set', () => {
    useAppStore.setState({
      homeLocation: {
        cityId: 1,
        cityName: 'New York',
        country: 'United States',
        state: 'New York',
        coordinates: { lat: 40.7128, long: -74.006 },
        source: LocationSource.Manual,
      },
    });

    render(<HomeLocationSelector />);
    expect(screen.getByText('New York, United States')).toBeInTheDocument();
  });

  it('renders home icon button', () => {
    render(<HomeLocationSelector />);
    const button = screen.getByRole('button', { name: /set home location/i });
    expect(button).toBeInTheDocument();
  });
});
