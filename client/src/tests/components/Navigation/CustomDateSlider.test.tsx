import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import CustomDateSlider from '@/components/Navigation/CustomDateSlider';

describe('CustomDateSlider', () => {
  const mockMarks = [
    { value: 1, label: 'Jan' },
    { value: 32, label: 'Feb' },
    { value: 60, label: 'Mar' },
  ];

  it('renders with initial value', () => {
    const mockOnChange = vi.fn();

    render(
      <CustomDateSlider
        value={100}
        onChange={mockOnChange}
        min={1}
        max={365}
        marks={mockMarks}
      />
    );

    // check that the formatted label is displayed (day 100 = Apr. 10)
    expect(screen.getByText('Apr. 10')).toBeInTheDocument();
  });

  it('displays all month marks', () => {
    const mockOnChange = vi.fn();

    render(
      <CustomDateSlider
        value={100}
        onChange={mockOnChange}
        min={1}
        max={365}
        marks={mockMarks}
      />
    );

    // verify all month labels are rendered
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
  });

  it('formats label correctly for different values', () => {
    const mockOnChange = vi.fn();

    const { rerender } = render(
      <CustomDateSlider
        value={1}
        onChange={mockOnChange}
        min={1}
        max={365}
        marks={mockMarks}
      />
    );

    // day 1 = Jan. 1
    expect(screen.getByText('Jan. 1')).toBeInTheDocument();

    // rerender with different value (day 365 = Dec. 31)
    rerender(
      <CustomDateSlider
        value={365}
        onChange={mockOnChange}
        min={1}
        max={365}
        marks={mockMarks}
      />
    );

    expect(screen.getByText('Dec. 31')).toBeInTheDocument();
  });

  it('renders with correct structure', () => {
    const mockOnChange = vi.fn();

    const { container } = render(
      <CustomDateSlider
        value={100}
        onChange={mockOnChange}
        min={1}
        max={365}
        marks={mockMarks}
      />
    );

    // verify the track container exists
    const trackContainer = container.querySelector(
      '.relative.h-2.cursor-pointer'
    );
    expect(trackContainer).toBeInTheDocument();

    // verify the thumb exists (it has rounded-full and shadow-lg classes)
    const thumb = container.querySelector('.rounded-full.shadow-lg');
    expect(thumb).toBeInTheDocument();
  });
});
