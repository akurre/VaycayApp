import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import DistanceSection from '@/components/CityPopup/DistanceSection';
import { useAppStore } from '@/stores/useAppStore';
import { TemperatureUnit } from '@/types/mapTypes';

// mock the store
vi.mock('@/stores/useAppStore');

// mock the utility functions
vi.mock('@/utils/location/calculateDistanceFromHome', () => ({
  calculateDistanceFromHome: vi.fn(() => {
    // return a mock distance based on coordinates
    return 100; // 100 km
  }),
}));

vi.mock('@/utils/location/formatDistance', () => ({
  formatDistance: vi.fn((distance: number) => `${distance} km`),
}));

describe('DistanceSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays distance when home location is set and coordinates are valid', () => {
    vi.mocked(useAppStore).mockImplementation((selector) =>
      selector({
        homeLocation: {
          cityId: 1,
          cityName: 'New York',
          country: 'United States',
          state: 'New York',
          coordinates: { lat: 40.7128, long: -74.006 },
          source: 'manual',
        },
        setHomeLocation: vi.fn(),
        homeCityData: null,
        setHomeCityData: vi.fn(),
        isLocationLoading: false,
        setIsLocationLoading: vi.fn(),
        locationError: null,
        setLocationError: vi.fn(),
        hasSeenWelcomeModal: false,
        setHasSeenWelcomeModal: vi.fn(),
        temperatureUnit: TemperatureUnit.Celsius,
        setTemperatureUnit: vi.fn(),
      })
    );

    render(<DistanceSection lat={51.5074} long={-0.1278} />);

    expect(screen.getByText('Distance from home')).toBeInTheDocument();
    expect(screen.getByText('100 km')).toBeInTheDocument();
  });

  it('displays message when home location is not set', () => {
    vi.mocked(useAppStore).mockImplementation((selector) =>
      selector({
        homeLocation: null,
        setHomeLocation: vi.fn(),
        homeCityData: null,
        setHomeCityData: vi.fn(),
        isLocationLoading: false,
        setIsLocationLoading: vi.fn(),
        locationError: null,
        setLocationError: vi.fn(),
        hasSeenWelcomeModal: false,
        setHasSeenWelcomeModal: vi.fn(),
        temperatureUnit: TemperatureUnit.Celsius,
        setTemperatureUnit: vi.fn(),
      })
    );

    render(<DistanceSection lat={51.5074} long={-0.1278} />);

    expect(
      screen.getByText('Set home location to see distance')
    ).toBeInTheDocument();
    expect(screen.queryByText('Distance from home')).not.toBeInTheDocument();
  });

  it('does not display distance when lat is null', () => {
    vi.mocked(useAppStore).mockImplementation((selector) =>
      selector({
        homeLocation: {
          cityId: 1,
          cityName: 'New York',
          country: 'United States',
          state: 'New York',
          coordinates: { lat: 40.7128, long: -74.006 },
          source: 'manual',
        },
        setHomeLocation: vi.fn(),
        homeCityData: null,
        setHomeCityData: vi.fn(),
        isLocationLoading: false,
        setIsLocationLoading: vi.fn(),
        locationError: null,
        setLocationError: vi.fn(),
        hasSeenWelcomeModal: false,
        setHasSeenWelcomeModal: vi.fn(),
        temperatureUnit: TemperatureUnit.Celsius,
        setTemperatureUnit: vi.fn(),
      })
    );

    render(<DistanceSection lat={null} long={-0.1278} />);

    expect(screen.queryByText('Distance from home')).not.toBeInTheDocument();
  });

  it('does not display distance when long is null', () => {
    vi.mocked(useAppStore).mockImplementation((selector) =>
      selector({
        homeLocation: {
          cityId: 1,
          cityName: 'New York',
          country: 'United States',
          state: 'New York',
          coordinates: { lat: 40.7128, long: -74.006 },
          source: 'manual',
        },
        setHomeLocation: vi.fn(),
        homeCityData: null,
        setHomeCityData: vi.fn(),
        isLocationLoading: false,
        setIsLocationLoading: vi.fn(),
        locationError: null,
        setLocationError: vi.fn(),
        hasSeenWelcomeModal: false,
        setHasSeenWelcomeModal: vi.fn(),
        temperatureUnit: TemperatureUnit.Celsius,
        setTemperatureUnit: vi.fn(),
      })
    );

    render(<DistanceSection lat={51.5074} long={null} />);

    expect(screen.queryByText('Distance from home')).not.toBeInTheDocument();
  });

  it('does not display distance when both coordinates are null', () => {
    vi.mocked(useAppStore).mockImplementation((selector) =>
      selector({
        homeLocation: {
          cityId: 1,
          cityName: 'New York',
          country: 'United States',
          state: 'New York',
          coordinates: { lat: 40.7128, long: -74.006 },
          source: 'manual',
        },
        setHomeLocation: vi.fn(),
        homeCityData: null,
        setHomeCityData: vi.fn(),
        isLocationLoading: false,
        setIsLocationLoading: vi.fn(),
        locationError: null,
        setLocationError: vi.fn(),
        hasSeenWelcomeModal: false,
        setHasSeenWelcomeModal: vi.fn(),
        temperatureUnit: TemperatureUnit.Celsius,
        setTemperatureUnit: vi.fn(),
      })
    );

    render(<DistanceSection lat={null} long={null} />);

    expect(screen.queryByText('Distance from home')).not.toBeInTheDocument();
  });

  it('renders Field component when distance is calculated', () => {
    vi.mocked(useAppStore).mockImplementation((selector) =>
      selector({
        homeLocation: {
          cityId: 1,
          cityName: 'New York',
          country: 'United States',
          state: 'New York',
          coordinates: { lat: 40.7128, long: -74.006 },
          source: 'manual',
        },
        setHomeLocation: vi.fn(),
        homeCityData: null,
        setHomeCityData: vi.fn(),
        isLocationLoading: false,
        setIsLocationLoading: vi.fn(),
        locationError: null,
        setLocationError: vi.fn(),
        hasSeenWelcomeModal: false,
        setHasSeenWelcomeModal: vi.fn(),
        temperatureUnit: TemperatureUnit.Celsius,
        setTemperatureUnit: vi.fn(),
      })
    );

    render(<DistanceSection lat={51.5074} long={-0.1278} />);

    // field component should render with label and value
    const field = screen.getByText('Distance from home').closest('div');
    expect(field).toBeInTheDocument();
  });
});
