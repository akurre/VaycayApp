import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import MobileTopCommandBar from '@/components/Navigation/Mobile/MobileTopCommandBar';
import { ViewMode, DataType, TemperatureUnit } from '@/types/mapTypes';

// Isolate to the bar itself — HamburgerSheet is tested separately.
vi.mock('@/components/Navigation/Mobile/HamburgerSheet', () => ({
  default: ({ opened }: { opened: boolean }) =>
    opened ? <div data-testid="hamburger-sheet-open">Sheet</div> : null,
}));

const defaultProps = {
  viewMode: ViewMode.Markers,
  onViewModeChange: vi.fn(),
  dataType: DataType.Temperature,
  onDataTypeChange: vi.fn(),
  temperatureUnit: TemperatureUnit.Celsius,
  onTemperatureUnitChange: vi.fn(),
};

describe('MobileTopCommandBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the top bar root', () => {
    render(<MobileTopCommandBar {...defaultProps} />);
    expect(screen.getByTestId('mobile-top-bar')).toBeInTheDocument();
  });

  it('renders the hamburger button', () => {
    render(<MobileTopCommandBar {...defaultProps} />);
    expect(screen.getByTestId('hamburger-button')).toBeInTheDocument();
  });

  it('renders MapViewToggle with markers and heatmap options', () => {
    render(<MobileTopCommandBar {...defaultProps} />);
    const radios = screen.getAllByRole('radio');
    const values = radios.map((r) => (r as HTMLInputElement).value);
    expect(values).toContain('markers');
    expect(values).toContain('heatmap');
  });

  it('renders MapDataToggle with temperature and sunshine options', () => {
    render(<MobileTopCommandBar {...defaultProps} />);
    const radios = screen.getAllByRole('radio');
    const values = radios.map((r) => (r as HTMLInputElement).value);
    expect(values).toContain('temperature');
    expect(values).toContain('sunshine');
  });

  it('renders TemperatureUnitToggle with celsius and fahrenheit options', () => {
    render(<MobileTopCommandBar {...defaultProps} />);
    const radios = screen.getAllByRole('radio');
    const values = radios.map((r) => (r as HTMLInputElement).value);
    expect(values).toContain('celsius');
    expect(values).toContain('fahrenheit');
  });

  it('renders all 6 toggle options in the bar (regression: no Date or Home toggle added)', () => {
    render(<MobileTopCommandBar {...defaultProps} />);
    // exactly 6 radios: markers, heatmap, temperature, sunshine, celsius, fahrenheit
    expect(screen.getAllByRole('radio')).toHaveLength(6);
  });

  it('opens HamburgerSheet when hamburger button is clicked', () => {
    render(<MobileTopCommandBar {...defaultProps} />);
    expect(
      screen.queryByTestId('hamburger-sheet-open')
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('hamburger-button'));
    expect(screen.getByTestId('hamburger-sheet-open')).toBeInTheDocument();
  });
});
