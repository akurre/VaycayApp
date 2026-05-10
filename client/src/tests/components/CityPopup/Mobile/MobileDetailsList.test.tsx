import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@/test-utils';
import MobileDetailsList from '@/components/CityPopup/Mobile/MobileDetailsList';
import type { RibbonStat } from '@/types/cityPopupTypes';

const mockStats: ReadonlyArray<RibbonStat> = [
  { label: 'Sun / yr', v1: '2200 hrs', v2: '1800 hrs' },
  { label: 'Rain / yr', v1: '950 mm', v2: '720 mm' },
  { label: "This day's range", v1: '15 / 25°C', v2: '10 / 20°C' },
  { label: 'From home', v1: '500 km', v2: '300 km' },
  { label: 'Population', v1: '8M', v2: '4M' },
];

describe('MobileDetailsList', () => {
  it('renders one card per stat (5 cards)', () => {
    render(<MobileDetailsList stats={mockStats} hasComparison />);
    const list = screen.getByTestId('mobile-details-list');
    expect(list.children).toHaveLength(5);
  });

  it('renders each stat label, v1 and v2 when hasComparison is true', () => {
    render(<MobileDetailsList stats={mockStats} hasComparison />);

    expect(screen.getByText('Sun / yr')).toBeInTheDocument();
    expect(screen.getByText('2200 hrs')).toBeInTheDocument();
    expect(screen.getByText('1800 hrs')).toBeInTheDocument();
    expect(screen.getByText("This day's range")).toBeInTheDocument();
    expect(screen.getByText('15 / 25°C')).toBeInTheDocument();
  });

  it('omits v2 values when hasComparison is false', () => {
    render(<MobileDetailsList stats={mockStats} hasComparison={false} />);

    expect(screen.getByText('2200 hrs')).toBeInTheDocument();
    expect(screen.queryByText('1800 hrs')).toBeNull();
    expect(screen.queryByText('720 mm')).toBeNull();
  });

  it('renders an empty list (zero cards) when stats is empty', () => {
    render(<MobileDetailsList stats={[]} hasComparison />);
    const list = screen.getByTestId('mobile-details-list');
    expect(list.children).toHaveLength(0);
  });

  it('uses the stat label as a stable React key (no key warnings)', () => {
    render(<MobileDetailsList stats={mockStats} hasComparison />);
    const list = screen.getByTestId('mobile-details-list');
    const labels = Array.from(list.children).map(
      (card) => within(card as HTMLElement).getAllByText(/\w/)[0]?.textContent
    );
    expect(labels).toEqual([
      'Sun / yr',
      'Rain / yr',
      "This day's range",
      'From home',
      'Population',
    ]);
  });
});
