import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import LatBadge from '@/components/CityPopup/Ribbon/LatBadge';

describe('LatBadge', () => {
  it('renders the label text', () => {
    render(<LatBadge label="N" />);
    expect(screen.getByText('N')).toBeInTheDocument();
  });

  it('renders as a span element with the provided label', () => {
    const { container } = render(<LatBadge label="EQ" />);
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe('EQ');
  });

  it('handles an empty label without crashing', () => {
    const { container } = render(<LatBadge label="" />);
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe('');
  });
});
