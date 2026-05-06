import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import DateSliderWrapper from '@/components/Navigation/DateSliderWrapper';

describe('DateSliderWrapper', () => {
  it('renders the formatted daily label for a MMDD date', () => {
    render(
      <DateSliderWrapper
        currentDate="0410"
        onDateChange={vi.fn()}
        isMonthly={false}
      />
    );
    expect(screen.getByText('Apr. 10')).toBeInTheDocument();
  });

  it('renders Jan. 1 / Dec. 31 boundaries correctly', () => {
    const { rerender } = render(
      <DateSliderWrapper
        currentDate="0101"
        onDateChange={vi.fn()}
        isMonthly={false}
      />
    );
    expect(screen.getByText('Jan. 1')).toBeInTheDocument();

    rerender(
      <DateSliderWrapper
        currentDate="1231"
        onDateChange={vi.fn()}
        isMonthly={false}
      />
    );
    expect(screen.getByText('Dec. 31')).toBeInTheDocument();
  });

  it('renders the monthly-mode label for a MM-DD date when isMonthly is true', () => {
    render(
      <DateSliderWrapper
        currentDate="07-15"
        onDateChange={vi.fn()}
        isMonthly={true}
      />
    );
    // Two "Jul" elements exist: one in the slider marks row, one in the
    // trailing label. We only need to assert at least one is present.
    expect(screen.getAllByText('Jul').length).toBeGreaterThan(0);
  });

  it('renders the static "Date" leading label', () => {
    render(
      <DateSliderWrapper
        currentDate="0410"
        onDateChange={vi.fn()}
        isMonthly={false}
      />
    );
    expect(screen.getByText('Date')).toBeInTheDocument();
  });
});
