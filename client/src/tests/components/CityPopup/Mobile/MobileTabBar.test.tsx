import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import MobileTabBar from '@/components/CityPopup/Mobile/MobileTabBar';
import { MobileTab } from '@/types/mobileTabType';

describe('MobileTabBar', () => {
  it('renders all four tabs in order: Temp / Sun / Precip / Details', () => {
    render(<MobileTabBar tab={MobileTab.Temperature} onTab={vi.fn()} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Temp',
      'Sun',
      'Precip',
      'Details',
    ]);
  });

  it('marks the active tab with aria-pressed=true and others false', () => {
    render(<MobileTabBar tab={MobileTab.Details} onTab={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Temp' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: 'Details' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('calls onTab with the clicked tab id', () => {
    const onTab = vi.fn();
    render(<MobileTabBar tab={MobileTab.Temperature} onTab={onTab} />);

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));
    expect(onTab).toHaveBeenCalledTimes(1);
    expect(onTab).toHaveBeenCalledWith(MobileTab.Details);
  });

  it('hides tabs not present in availableTabs', () => {
    render(
      <MobileTabBar
        tab={MobileTab.Temperature}
        onTab={vi.fn()}
        availableTabs={[
          MobileTab.Temperature,
          MobileTab.Precip,
          MobileTab.Details,
        ]}
      />
    );

    expect(screen.queryByRole('button', { name: 'Sun' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Temp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Precip' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument();
  });

  it('anchors the bar at the bottom with sticky positioning', () => {
    render(<MobileTabBar tab={MobileTab.Temperature} onTab={vi.fn()} />);
    const bar = screen.getByTestId('mobile-tab-bar');
    expect(bar.className).toContain('sticky');
    expect(bar.className).toContain('bottom-0');
  });
});
