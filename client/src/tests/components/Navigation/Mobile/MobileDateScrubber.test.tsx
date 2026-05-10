import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import MobileDateScrubber from '@/components/Navigation/Mobile/MobileDateScrubber';

describe('MobileDateScrubber', () => {
  it('renders the selected date', () => {
    render(<MobileDateScrubber selectedDate="05-15" />);
    expect(screen.getByText('DATE: 05-15')).toBeInTheDocument();
  });

  it('defaults to visible (translateY(0))', () => {
    render(<MobileDateScrubber selectedDate="05-15" />);
    const scrubber = screen.getByText('DATE: 05-15').closest('div');
    expect(scrubber?.style.transform).toBe('translateY(0)');
  });

  it('slides offscreen when hidden=true', () => {
    render(<MobileDateScrubber selectedDate="05-15" hidden />);
    const scrubber = screen.getByText('DATE: 05-15').closest('div');
    expect(scrubber?.style.transform).toBe('translateY(120%)');
  });
});
