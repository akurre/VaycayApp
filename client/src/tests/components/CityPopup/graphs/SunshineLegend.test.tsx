import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import SunshineLegend from '@/components/CityPopup/graphs/SunshineLegend';

describe('SunshineLegend', () => {
  it('renders legend labels', () => {
    render(<SunshineLegend mainColor="#ff0000" />);
    expect(screen.getByText('actual sun')).toBeInTheDocument();
    expect(screen.getByText('100% ceiling')).toBeInTheDocument();
  });

  it('renders one swatch when comparisonColor is not provided', () => {
    const { container } = render(<SunshineLegend mainColor="#ff0000" />);
    const swatches = container.querySelectorAll('[style*="background"]');
    expect(swatches).toHaveLength(1);
  });

  it('renders two swatches when comparisonColor is provided', () => {
    const { container } = render(
      <SunshineLegend mainColor="#ff0000" comparisonColor="#0000ff" />
    );
    const swatches = container.querySelectorAll('[style*="background"]');
    expect(swatches).toHaveLength(2);
  });

  it('renders one swatch when comparisonColor is null', () => {
    const { container } = render(
      <SunshineLegend mainColor="#ff0000" comparisonColor={null} />
    );
    const swatches = container.querySelectorAll('[style*="background"]');
    expect(swatches).toHaveLength(1);
  });
});
