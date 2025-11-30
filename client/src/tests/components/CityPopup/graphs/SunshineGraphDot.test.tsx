import { describe, it, expect } from 'vitest';
import { render } from '@/test-utils';
import SunshineGraphDot from '@/components/CityPopup/graphs/SunshineGraphDot';

describe('SunshineGraphDot', () => {
  it('returns null when cx is missing', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot
          cy={100}
          payload={{ monthIndex: 7, hours: 250 }}
          selectedMonth={7}
        />
      </svg>
    );
    expect(container.querySelector('circle')).not.toBeInTheDocument();
  });

  it('returns null when cy is missing', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot
          cx={100}
          payload={{ monthIndex: 7, hours: 250 }}
          selectedMonth={7}
        />
      </svg>
    );
    expect(container.querySelector('circle')).not.toBeInTheDocument();
  });

  it('returns null when payload is missing', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot cx={100} cy={100} selectedMonth={7} />
      </svg>
    );
    expect(container.querySelector('circle')).not.toBeInTheDocument();
  });

  it('returns null when selectedMonth is missing', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot
          cx={100}
          cy={100}
          payload={{ monthIndex: 7, hours: 250 }}
        />
      </svg>
    );
    expect(container.querySelector('circle')).not.toBeInTheDocument();
  });

  it('renders circle when month matches selectedMonth', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot
          cx={100}
          cy={100}
          payload={{ monthIndex: 7, hours: 250 }}
          selectedMonth={7}
        />
      </svg>
    );
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('cx', '100');
    expect(circle).toHaveAttribute('cy', '100');
    expect(circle).toHaveAttribute('r', '6');
  });

  it('returns null when month does not match selectedMonth', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot
          cx={100}
          cy={100}
          payload={{ monthIndex: 7, hours: 250 }}
          selectedMonth={8}
        />
      </svg>
    );
    expect(container.querySelector('circle')).not.toBeInTheDocument();
  });

  it('renders with correct styling', () => {
    const { container } = render(
      <svg>
        <SunshineGraphDot
          cx={150}
          cy={200}
          payload={{ monthIndex: 3, hours: 180 }}
          selectedMonth={3}
        />
      </svg>
    );
    const circle = container.querySelector('circle');
    expect(circle).toHaveAttribute('stroke', '#fff');
    expect(circle).toHaveAttribute('stroke-width', '2');
  });
});
