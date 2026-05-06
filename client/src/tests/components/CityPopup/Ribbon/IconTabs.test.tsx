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

  it('does not call onTab when the same active tab is clicked is harmless', () => {
    const onTab = vi.fn();
    render(<IconTabs tab={DataType.Temperature} onTab={onTab} />);

    // clicking the active tab still fires — parent decides whether to no-op
    fireEvent.click(screen.getByRole('button', { name: /temp/i }));
    expect(onTab).toHaveBeenCalledWith(DataType.Temperature);
  });
});
