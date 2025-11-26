import { describe, it, expect } from 'vitest';
import { render } from '@/test-utils';
import SunshineGraphDot from '@/components/CityPopup/SunshineGraphDot';

describe('SunshineGraphDot', () => {
  const mockPayload = {
    monthIndex: 7,
    hours: 280,
  };

  it('renders a dot when all required props are provided and month matches', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot cx={100} cy={50} payload={mockPayload} selectedMonth={7} />
      </svg>
    );

    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('cx', '100');
    expect(circle).toHaveAttribute('cy', '50');
    expect(circle).toHaveAttribute('r', '6');
  });

  it('returns null when selectedMonth does not match payload monthIndex', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot cx={100} cy={50} payload={mockPayload} selectedMonth={5} />
      </svg>
    );

    const circle = container.querySelector('circle');
    expect(circle).not.toBeInTheDocument();
  });

  it('returns null when cx is not provided', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot cy={50} payload={mockPayload} selectedMonth={7} />
      </svg>
    );

    const circle = container.querySelector('circle');
    expect(circle).not.toBeInTheDocument();
  });

  it('returns null when cy is not provided', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot cx={100} payload={mockPayload} selectedMonth={7} />
      </svg>
    );

    const circle = container.querySelector('circle');
    expect(circle).not.toBeInTheDocument();
  });

  it('returns null when payload is not provided', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot cx={100} cy={50} selectedMonth={7} />
      </svg>
    );

    const circle = container.querySelector('circle');
    expect(circle).not.toBeInTheDocument();
  });

  it('returns null when selectedMonth is not provided', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot cx={100} cy={50} payload={mockPayload} />
      </svg>
    );

    const circle = container.querySelector('circle');
    expect(circle).not.toBeInTheDocument();
  });
});
