import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { render, screen } from '@/test-utils';
import MobileDateScrubber from '@/components/Navigation/Mobile/MobileDateScrubber';

interface CapturedSliderProps {
  value: number;
  onChange: (value: number) => void;
  onValuePreview?: (value: number) => void;
  min: number;
  max: number;
  marks: Array<{ value: number; label: string }>;
  isMonthly?: boolean;
}

const captured: { props: CapturedSliderProps | null } = { props: null };

vi.mock('@/components/Navigation/CustomDateSlider', () => ({
  default: (props: CapturedSliderProps) => {
    captured.props = props;
    return <div data-testid="mock-custom-date-slider" />;
  },
}));

describe('MobileDateScrubber', () => {
  beforeEach(() => {
    captured.props = null;
  });

  it('renders the formatted daily label for an MMDD selectedDate', () => {
    render(<MobileDateScrubber selectedDate="0810" onDateChange={vi.fn()} />);
    expect(screen.getByText('Aug. 10')).toBeInTheDocument();
  });

  it('renders Jan. 1 / Dec. 31 daily boundaries correctly', () => {
    const { rerender } = render(
      <MobileDateScrubber selectedDate="0101" onDateChange={vi.fn()} />
    );
    expect(screen.getByText('Jan. 1')).toBeInTheDocument();

    rerender(<MobileDateScrubber selectedDate="1231" onDateChange={vi.fn()} />);
    expect(screen.getByText('Dec. 31')).toBeInTheDocument();
  });

  it('renders the monthly label when isMonthly is true', () => {
    render(
      <MobileDateScrubber
        selectedDate="07-15"
        onDateChange={vi.fn()}
        isMonthly
      />
    );
    expect(screen.getByText('Jul')).toBeInTheDocument();
  });

  it('passes the day-of-year as slider value in daily mode', () => {
    render(<MobileDateScrubber selectedDate="0410" onDateChange={vi.fn()} />);
    // Apr 10 = 31 + 28 + 31 + 10 = 100
    expect(captured.props?.value).toBe(100);
    expect(captured.props?.min).toBe(1);
    expect(captured.props?.max).toBe(365);
    expect(captured.props?.isMonthly).toBe(false);
  });

  it('passes the month index as slider value in monthly mode', () => {
    render(
      <MobileDateScrubber
        selectedDate="07-15"
        onDateChange={vi.fn()}
        isMonthly
      />
    );
    expect(captured.props?.value).toBe(7);
    expect(captured.props?.isMonthly).toBe(true);
  });

  it('does not call onDateChange while only onValuePreview is invoked', () => {
    const onDateChange = vi.fn();
    render(
      <MobileDateScrubber selectedDate="0410" onDateChange={onDateChange} />
    );

    act(() => {
      captured.props?.onValuePreview?.(120);
      captured.props?.onValuePreview?.(140);
      captured.props?.onValuePreview?.(160);
    });

    expect(onDateChange).not.toHaveBeenCalled();
  });

  it('updates the trailing label live during onValuePreview without commit', () => {
    const onDateChange = vi.fn();
    render(
      <MobileDateScrubber selectedDate="0410" onDateChange={onDateChange} />
    );

    expect(screen.getByText('Apr. 10')).toBeInTheDocument();

    // Day-of-year 213 = Aug 1
    act(() => {
      captured.props?.onValuePreview?.(213);
    });
    expect(screen.getByText('Aug. 1')).toBeInTheDocument();
    expect(onDateChange).not.toHaveBeenCalled();
  });

  it('commits exactly once with the formatted MMDD date when onChange fires', () => {
    const onDateChange = vi.fn();
    render(
      <MobileDateScrubber selectedDate="0410" onDateChange={onDateChange} />
    );

    captured.props?.onChange(213);

    expect(onDateChange).toHaveBeenCalledTimes(1);
    expect(onDateChange).toHaveBeenCalledWith('0801');
  });

  it('commits the MM-15 date when onChange fires in monthly mode', () => {
    const onDateChange = vi.fn();
    render(
      <MobileDateScrubber
        selectedDate="07-15"
        onDateChange={onDateChange}
        isMonthly
      />
    );

    captured.props?.onChange(11);

    expect(onDateChange).toHaveBeenCalledTimes(1);
    expect(onDateChange).toHaveBeenCalledWith('11-15');
  });

  it('positions the bar fixed at the bottom of the viewport with the configured insets', () => {
    render(<MobileDateScrubber selectedDate="0410" onDateChange={vi.fn()} />);
    const root = screen.getByTestId('mobile-date-scrubber');
    expect(root.style.position).toBe('fixed');
    expect(root.style.bottom).toBe('16px');
    expect(root.style.left).toBe('12px');
    expect(root.style.right).toBe('12px');
  });

  it('defaults to visible (translateY(0))', () => {
    render(<MobileDateScrubber selectedDate="0410" onDateChange={vi.fn()} />);
    const root = screen.getByTestId('mobile-date-scrubber');
    expect(root.style.transform).toBe('translateY(0)');
  });

  it('slides offscreen when hidden=true', () => {
    render(
      <MobileDateScrubber
        selectedDate="0410"
        onDateChange={vi.fn()}
        hidden
      />
    );
    const root = screen.getByTestId('mobile-date-scrubber');
    expect(root.style.transform).toBe('translateY(120%)');
  });

  it('renders the CustomDateSlider', () => {
    render(<MobileDateScrubber selectedDate="0410" onDateChange={vi.fn()} />);
    expect(screen.getByTestId('mock-custom-date-slider')).toBeInTheDocument();
  });

  it('passes 12 marks with text labels only at the quarter midpoints in daily mode', () => {
    render(<MobileDateScrubber selectedDate="0410" onDateChange={vi.fn()} />);
    const marks = captured.props?.marks ?? [];
    expect(marks).toHaveLength(12);
    expect(marks.map((m) => m.label)).toEqual([
      '',
      'Feb',
      '',
      '',
      'May',
      '',
      '',
      'Aug',
      '',
      '',
      'Nov',
      '',
    ]);
  });

  it('passes 12 marks with text labels only at the quarter midpoints in monthly mode', () => {
    render(
      <MobileDateScrubber
        selectedDate="07-15"
        onDateChange={vi.fn()}
        isMonthly
      />
    );
    const marks = captured.props?.marks ?? [];
    expect(marks).toHaveLength(12);
    expect(marks.map((m) => m.label)).toEqual([
      '',
      'Feb',
      '',
      '',
      'May',
      '',
      '',
      'Aug',
      '',
      '',
      'Nov',
      '',
    ]);
    expect(marks.map((m) => m.value)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });
});
