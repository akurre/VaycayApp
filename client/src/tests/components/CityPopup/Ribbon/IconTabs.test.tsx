import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import IconTabs from '@/components/CityPopup/Ribbon/IconTabs';
import { DataType } from '@/types/mapTypes';

describe('IconTabs', () => {
  it('renders all three tabs with their labels', () => {
    render(<IconTabs tab={DataType.Temperature} onTab={vi.fn()} />);

    expect(screen.getByRole('button', { name: /temp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sun/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /precip/i })).toBeInTheDocument();
  });

  it('marks the active tab with aria-pressed=true and others false', () => {
    render(<IconTabs tab={DataType.Sunshine} onTab={vi.fn()} />);

    expect(screen.getByRole('button', { name: /temp/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: /sun/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: /precip/i })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('calls onTab with the clicked tab id', () => {
    const onTab = vi.fn();
    render(<IconTabs tab={DataType.Temperature} onTab={onTab} />);

    fireEvent.click(screen.getByRole('button', { name: /precip/i }));
    expect(onTab).toHaveBeenCalledWith(DataType.Precip);
  });

  it('still fires onTab when the active tab is clicked (parent decides whether to no-op)', () => {
    const onTab = vi.fn();
    render(<IconTabs tab={DataType.Temperature} onTab={onTab} />);

    fireEvent.click(screen.getByRole('button', { name: /temp/i }));
    expect(onTab).toHaveBeenCalledWith(DataType.Temperature);
  });

  it('hides tabs not present in availableTabs', () => {
    render(
      <IconTabs
        tab={DataType.Temperature}
        onTab={vi.fn()}
        availableTabs={[DataType.Temperature, DataType.Precip]}
      />
    );

    expect(screen.getByRole('button', { name: /temp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /precip/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sun/i })).toBeNull();
  });
});
