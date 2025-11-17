import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import CityPopup from '@/components/CityPopup/CityPopup';
import { WeatherData } from '@/types/cityWeatherDataType';
import { SunshineData } from '@/types/sunshineDataType';
import * as useCityDataModule from '@/api/dates/useCityData';

// Mock the useCityData hook
vi.mock('@/api/dates/useCityData', () => ({
  default: vi.fn()
}));

describe('CityPopup', () => {
  const mockOnClose = vi.fn();
  
  // Sample weather data
  const weatherData: WeatherData = {
    city: 'New York',
    country: 'United States',
    state: 'New York',
    suburb: 'Suburb',
    date: '2020-01-01',
    lat: 40.7128,
    long: -74.006,
    population: 8419000,
    precipitation: 10,
    snowDepth: 5,
    avgTemperature: 5,
    maxTemperature: 10,
    minTemperature: 0,
    stationName: 'NYC Station',
    submitterId: null
  };
  
  // Sample sunshine data
  const sunshineData: SunshineData = {
    city: 'New York',
    country: 'United States',
    state: 'New York',
    suburb: 'Suburb',
    lat: 40.7128,
    long: -74.006,
    population: 8419000,
    jan: 150,
    feb: 160,
    mar: 170,
    apr: 180,
    may: 190,
    jun: 200,
    jul: 210,
    aug: 200,
    sep: 190,
    oct: 180,
    nov: 170,
    dec: 160,
    stationName: 'NYC Station'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation
    (useCityDataModule.default as any).mockReturnValue({
      weatherData: null,
      sunshineData: null,
      isLoading: false,
      hasError: false
    });
  });

  it('renders weather data correctly', () => {
    render(<CityPopup city={weatherData} onClose={mockOnClose} selectedMonth={1} />);
    
    expect(screen.getByText('New York, United States')).toBeInTheDocument();
    expect(screen.getByText('State/Region')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('2020-01-01')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('5.0°C')).toBeInTheDocument();
  });

  it('renders sunshine data correctly', () => {
    render(<CityPopup city={sunshineData} onClose={mockOnClose} selectedMonth={1} />);
    
    expect(screen.getByText('New York, United States')).toBeInTheDocument();
    expect(screen.getByText('State/Region')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
    // Check for sunshine hours (specific text depends on SunshineSection implementation)
    expect(screen.getByText('Average Annual Sunshine')).toBeInTheDocument();
    expect(screen.getByText('January Sunshine')).toBeInTheDocument();
  });

  it('shows both weather and sunshine data when viewing weather data and sunshine data is fetched', () => {
    // Mock the hook to return sunshine data when viewing weather data
    (useCityDataModule.default as any).mockReturnValue({
      weatherData: null, // Not needed since we're passing weather data directly
      sunshineData: sunshineData,
      isLoading: false,
      hasError: false
    });
    
    render(<CityPopup city={weatherData} onClose={mockOnClose} selectedMonth={1} />);
    
    // Check for weather data
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('5.0°C')).toBeInTheDocument();
    
    // Check for sunshine data
    expect(screen.getByText('Average Annual Sunshine')).toBeInTheDocument();
  });

  it('shows both weather and sunshine data when viewing sunshine data and weather data is fetched', () => {
    // Mock the hook to return weather data when viewing sunshine data
    (useCityDataModule.default as any).mockReturnValue({
      weatherData: weatherData,
      sunshineData: null, // Not needed since we're passing sunshine data directly
      isLoading: false,
      hasError: false
    });
    
    render(<CityPopup city={sunshineData} onClose={mockOnClose} selectedMonth={1} />);
    
    // Check for sunshine data
    expect(screen.getByText('Average Annual Sunshine')).toBeInTheDocument();
    
    // Check for weather data
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('5.0°C')).toBeInTheDocument();
  });

  it('shows loading state when data is being fetched', () => {
    // Mock the hook to indicate loading
    (useCityDataModule.default as any).mockReturnValue({
      weatherData: null,
      sunshineData: null,
      isLoading: true,
      hasError: false
    });
    
    render(<CityPopup city={weatherData} onClose={mockOnClose} selectedMonth={1} />);
    
    // Weather data should still be shown since it's passed directly
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    
    // But sunshine data should show loading
    // The Loader component is present but doesn't have text content
    // Instead, check for the progressbar role
    expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
  });

  it('shows error state when data fetching fails', () => {
    // Mock the hook to indicate error
    (useCityDataModule.default as any).mockReturnValue({
      weatherData: null,
      sunshineData: null,
      isLoading: false,
      hasError: true
    });
    
    render(<CityPopup city={weatherData} onClose={mockOnClose} selectedMonth={1} />);
    
    // Weather data should still be shown since it's passed directly
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    
    // But sunshine data should show error
    expect(screen.getByText('Failed to load sunshine data for this city.')).toBeInTheDocument();
  });

  it('uses current month when selectedMonth is not provided', () => {
    const originalDate = Date;
    const mockDate = new Date(2023, 0, 15); // January 15, 2023
    
    // Mock the Date constructor to return a fixed date
    global.Date = class extends Date {
      constructor() {
        super();
        return mockDate;
      }
      
      getMonth() {
        return 0; // January (0-indexed)
      }
    } as any;
    
    render(<CityPopup city={weatherData} onClose={mockOnClose} />);
    
    // Verify that useCityData was called with the current month (January = 1)
    expect(useCityDataModule.default).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedMonth: 1
      })
    );
    
    // Restore the original Date
    global.Date = originalDate;
  });
});
