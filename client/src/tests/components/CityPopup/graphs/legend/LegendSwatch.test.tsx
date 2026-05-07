import { describe, it, expect } from 'vitest';
import { render } from '@/test-utils';
import LegendSwatch from '@/components/CityPopup/graphs/legend/LegendSwatch';

describe('LegendSwatch', () => {
  it('renders with the given background color', () => {
    const { container } = render(<LegendSwatch color="#abc123" />);

    const swatch = container.querySelector('span');
    expect(swatch).toBeInTheDocument();
    expect(swatch?.getAttribute('style')).toContain('#abc123');
  });

  it('keeps the swatch a fixed 2px tall', () => {
    const { container } = render(<LegendSwatch color="#000" />);

    const swatch = container.querySelector('span');
    expect(swatch?.getAttribute('style')).toMatch(/height:\s*2px/);
  });
});
