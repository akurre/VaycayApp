import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import MobileDateScrubber from '@/components/Navigation/Mobile/MobileDateScrubber';

describe('MobileDateScrubber', () => {
  it('renders the selected date', () => {
    render(<MobileDateScrubber selectedDate="05-15" />);
    expect(screen.getByText('DATE: 05-15')).toBeInTheDocument();
  });

  it('defaults to visible (translateY(0))', () => {
    const { container } = render(<MobileDateScrubber selectedDate="05-15" />);
    expect(container.firstChild).toHaveStyle({ transform: 'translateY(0)' });
  });

  it('slides offscreen when hidden=true', () => {
    const { container } = render(
      <MobileDateScrubber selectedDate="05-15" hidden />
    );
    expect(container.firstChild).toHaveStyle({ transform: 'translateY(120%)' });
  });
});
