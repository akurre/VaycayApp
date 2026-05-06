import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import DateTriggerButton from '@/components/Navigation/DateTriggerButton';

describe('DateTriggerButton', () => {
  it('renders the daily-mode label for a MMDD date', () => {
    render(<DateTriggerButton isOpen={false} date="0410" isMonthly={false} />);
    expect(screen.getByRole('button')).toHaveTextContent('Apr. 10');
  });

  it('renders the year boundaries correctly', () => {
    const { rerender } = render(
      <DateTriggerButton isOpen={false} date="0101" isMonthly={false} />
    );
    expect(screen.getByRole('button')).toHaveTextContent('Jan. 1');

    rerender(<DateTriggerButton isOpen={false} date="1231" isMonthly={false} />);
    expect(screen.getByRole('button')).toHaveTextContent('Dec. 31');
  });

  it('renders the monthly-mode label for a MM-15 date', () => {
    render(<DateTriggerButton isOpen={false} date="07-15" isMonthly={true} />);
    expect(screen.getByRole('button')).toHaveTextContent('Jul');
  });

  it('renders a button regardless of isOpen', () => {
    const { rerender } = render(
      <DateTriggerButton isOpen={false} date="0410" isMonthly={false} />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<DateTriggerButton isOpen={true} date="0410" isMonthly={false} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
