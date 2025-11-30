import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import { CustomChartLegend } from '@/components/CityPopup/graphs/CustomChartLegend';

describe('CustomChartLegend', () => {
  it('returns null when payload is undefined', () => {
    const { container } = render(<CustomChartLegend />);
    // When payload is undefined, the component returns null, so there should be no legend content
    const legendDiv = container.querySelector('[style*="display: flex"]');
    expect(legendDiv).not.toBeInTheDocument();
  });

  it('renders legend items', () => {
    const payload = [
      { value: 'Temperature', color: '#ff0000', id: 'temp' },
      { value: 'Sunshine', color: '#ffaa00', id: 'sun' },
    ];
    render(<CustomChartLegend payload={payload} />);
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Sunshine')).toBeInTheDocument();
  });

  it('renders dashed lines for dashed entries', () => {
    const payload = [
      {
        value: 'Dashed Line',
        color: '#0000ff',
        id: 'dashed',
        payload: { strokeDasharray: '3 3' },
      },
    ];
    const { container } = render(<CustomChartLegend payload={payload} />);
    const line = container.querySelector('line');
    expect(line).toHaveAttribute('stroke-dasharray', '3 3');
  });

  it('renders solid lines for non-dashed entries', () => {
    const payload = [
      {
        value: 'Solid Line',
        color: '#00ff00',
        id: 'solid',
        payload: {},
      },
    ];
    const { container } = render(<CustomChartLegend payload={payload} />);
    const line = container.querySelector('line');
    expect(line).not.toHaveAttribute('stroke-dasharray');
  });

  it('uses fallback for missing value', () => {
    const payload = [
      { color: '#ff0000', id: 'test' },
    ];
    const { container } = render(<CustomChartLegend payload={payload} />);
    // When value is missing, it defaults to empty string
    const spans = container.querySelectorAll('span');
    // There should be at least one span (for the empty value)
    expect(spans.length).toBeGreaterThan(0);
  });

  it('generates key using id when available', () => {
    const payload = [
      { value: 'Test', color: '#ff0000', id: 'unique-id' },
    ];
    const { container } = render(<CustomChartLegend payload={payload} />);
    expect(container.querySelector('[style*="display: flex"]')).toBeInTheDocument();
  });

  it('generates key using value when id is missing', () => {
    const payload = [
      { value: 'Test Value', color: '#ff0000' },
    ];
    const { container } = render(<CustomChartLegend payload={payload} />);
    expect(screen.getByText('Test Value')).toBeInTheDocument();
  });
});
