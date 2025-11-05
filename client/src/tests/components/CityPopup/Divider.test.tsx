import { describe, it, expect } from 'vitest';
import { render } from '@/test-utils';
import Divider from '@/components/CityPopup/Divider';

describe('Divider', () => {
  it('renders with padding top', () => {
    const { container } = render(<Divider />);

    const divider = container.querySelector('.pt-3');
    expect(divider).toBeInTheDocument();
  });

  it('applies theme-based border color', () => {
    const { container } = render(<Divider />);

    const divider = container.querySelector('.pt-3') as HTMLElement;
    
    // verify border is applied with inline style
    expect(divider.style.borderTop).toBeTruthy();
    expect(divider.style.borderTop).toContain('1px');
    expect(divider.style.borderTop).toContain('solid');
  });
});
