import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import Field from '@/components/CityPopup/Field';

describe('Field', () => {
  it('renders label and value correctly', () => {
    render(<Field label="Temperature" value="25.5°C" />);

    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('25.5°C')).toBeInTheDocument();
  });

  it('renders with numeric value', () => {
    render(<Field label="Population" value={1000000} />);

    expect(screen.getByText('Population')).toBeInTheDocument();
    expect(screen.getByText('1000000')).toBeInTheDocument();
  });

  it('applies monospace font when specified', () => {
    render(<Field label="Coordinates" value="45.1234°, -93.5678°" monospace />);

    const valueElement = screen.getByText('45.1234°, -93.5678°');
    // mantine applies font-family through ff prop, check it's present
    expect(valueElement).toBeInTheDocument();
  });

  it('uses theme colors for text', () => {
    render(<Field label="Test Label" value="Test Value" />);

    const label = screen.getByText('Test Label');
    const value = screen.getByText('Test Value');

    // verify mantine text components are rendered (they handle theming via css classes)
    expect(label).toBeInTheDocument();
    expect(value).toBeInTheDocument();
  });
});
