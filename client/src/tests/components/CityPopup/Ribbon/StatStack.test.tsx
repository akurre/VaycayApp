import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import StatStack from '@/components/CityPopup/Ribbon/StatStack';
import type { RibbonStat } from '@/types/cityPopupTypes';
import { RIBBON_STAT_RAIL_WIDTH_PX } from '@/const';

const STATS: RibbonStat[] = [
  { label: 'Sun / yr', v1: '1820h', v2: '1500h' },
  { label: 'Rain / yr', v1: '600mm', v2: '750mm' },
  { label: 'Today range', v1: '5°C–17°C', v2: '11°C–22°C' },
  { label: 'Avg today', v1: '11°C', v2: '17°C' },
  { label: 'Population', v1: '3.5M', v2: '12M' },
];

describe('StatStack', () => {
  it('renders all five stat labels', () => {
    render(<StatStack stats={STATS} hasComparison={false} />);

    STATS.forEach((s) => {
      expect(screen.getByText(s.label)).toBeInTheDocument();
    });
  });

  it('renders v1 in single-city mode and omits v2', () => {
    render(<StatStack stats={STATS} hasComparison={false} />);

    expect(screen.getByText('1820h')).toBeInTheDocument();
    expect(screen.queryByText('1500h')).not.toBeInTheDocument();
  });

  it('renders both v1 and v2 in comparison mode', () => {
    render(<StatStack stats={STATS} hasComparison={true} />);

    expect(screen.getByText('1820h')).toBeInTheDocument();
    expect(screen.getByText('1500h')).toBeInTheDocument();
  });

  it('uses the named width constant for the rail container', () => {
    render(<StatStack stats={STATS} hasComparison={false} />);
    const rail = screen.getByTestId('stat-rail');
    const widthAttr =
      rail.style.width || (rail.getAttribute('style') ?? '');
    expect(widthAttr).toContain(String(RIBBON_STAT_RAIL_WIDTH_PX));
  });

  it('renders an em-dash placeholder when v1 is — (no-data)', () => {
    const noDataStats: RibbonStat[] = [
      { label: 'Sun / yr', v1: '—', v2: '—' },
    ];
    render(<StatStack stats={noDataStats} hasComparison={true} />);

    expect(screen.getAllByText('—').length).toBe(2);
  });
});
