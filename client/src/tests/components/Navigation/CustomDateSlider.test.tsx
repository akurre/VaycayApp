import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import CustomDateSlider from '@/components/Navigation/CustomDateSlider';

describe('CustomDateSlider', () => {
  const mockMarks = [
    { value: 1, label: 'Jan' },
    { value: 32, label: 'Feb' },
    { value: 60, label: 'Mar' },
  ];

  it('displays all month marks', () => {
    render(
      <CustomDateSlider
        value={100}
        onChange={vi.fn()}
        min={1}
        max={365}
        marks={mockMarks}
      />
    );

    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
  });

  it('renders track and thumb structure', () => {
    const { container } = render(
      <CustomDateSlider
        value={100}
        onChange={vi.fn()}
        min={1}
        max={365}
        marks={mockMarks}
      />
    );

    const trackContainer = container.querySelector(
      '.relative.cursor-pointer'
    );
    expect(trackContainer).toBeInTheDocument();

    const thumb = container.querySelector('.cursor-grab');
    expect(thumb).toBeInTheDocument();
  });
});
