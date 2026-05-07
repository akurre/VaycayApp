import { describe, it, expect, vi } from 'vitest';
import { render } from '@/test-utils';
import RechartsLineGraph from '@/components/CityPopup/graphs/RechartsLineGraph';
import type {
  LineConfig,
  ReferenceLineConfig,
} from '@/types/chartTypes';

describe('RechartsLineGraph', () => {
  const mockData = [
    { month: 'Jan', value: 10, max: 20 },
    { month: 'Feb', value: 15, max: 22 },
    { month: 'Mar', value: 20, max: 25 },
    { month: 'Apr', value: 25, max: 28 },
  ];

  const basicLines: LineConfig[] = [
    {
      dataKey: 'value',
      name: 'Actual',
      stroke: '#3b82f6',
      strokeWidth: 2,
    },
  ];

  it('renders the line chart component', () => {
    const { container } = render(
      <RechartsLineGraph
        data={mockData}
        xAxisDataKey="month"
        lines={basicLines}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders with custom margins', () => {
    const { container } = render(
      <RechartsLineGraph
        data={mockData}
        xAxisDataKey="month"
        lines={basicLines}
        margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders with multiple lines', () => {
    const multipleLines: LineConfig[] = [
      {
        dataKey: 'value',
        name: 'Actual Value',
        stroke: '#3b82f6',
      },
      {
        dataKey: 'max',
        name: 'Maximum',
        stroke: '#ef4444',
      },
    ];

    const { container } = render(
      <RechartsLineGraph
        data={mockData}
        xAxisDataKey="month"
        lines={multipleLines}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders with reference lines', () => {
    const referenceLines: ReferenceLineConfig[] = [
      {
        x: 'Feb',
        stroke: '#3b82f6',
        strokeDasharray: '5 5',
      },
    ];

    const { container } = render(
      <RechartsLineGraph
        data={mockData}
        xAxisDataKey="month"
        lines={basicLines}
        referenceLines={referenceLines}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('handles empty data array', () => {
    const { container } = render(
      <RechartsLineGraph
        data={[]}
        xAxisDataKey="month"
        lines={basicLines}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('accepts the onHover prop without error', () => {
    const onHover = vi.fn();
    const { container } = render(
      <RechartsLineGraph
        data={mockData}
        xAxisDataKey="month"
        lines={basicLines}
        onHover={onHover}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders with complex line configurations', () => {
    const complexLines: LineConfig[] = [
      {
        dataKey: 'value',
        name: 'Solid Line',
        stroke: '#3b82f6',
        strokeWidth: 2,
        dot: true,
      },
      {
        dataKey: 'max',
        name: 'Dashed Line',
        stroke: '#ef4444',
        strokeWidth: 1.5,
        strokeDasharray: '5 5',
        dot: false,
      },
    ];

    const { container } = render(
      <RechartsLineGraph
        data={mockData}
        xAxisDataKey="month"
        lines={complexLines}
      />
    );

    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });
});
