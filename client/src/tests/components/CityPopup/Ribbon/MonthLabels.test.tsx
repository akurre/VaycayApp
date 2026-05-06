import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import MonthLabels from '@/components/CityPopup/Ribbon/MonthLabels';

describe('MonthLabels', () => {
  it('renders all twelve month abbreviations in order', () => {
    render(<MonthLabels />);

    const expected = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    expected.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
});
