import { describe, it, expect } from 'vitest';
import { render } from '@/test-utils';
import LegendDash from '@/components/CityPopup/graphs/legend/LegendDash';

describe('LegendDash', () => {
  it('renders with the given border color', () => {
    const { container } = render(<LegendDash color="#abc123" />);

    const dash = container.querySelector('span');
    expect(dash).toBeInTheDocument();
    expect(dash?.getAttribute('style')).toContain('#abc123');
  });

  it('renders as a dashed border-top span', () => {
    const { container } = render(<LegendDash color="#000" />);

    const dash = container.querySelector('span');
    expect(dash?.className).toContain('border-dashed');
    expect(dash?.className).toContain('border-t');
  });
});
