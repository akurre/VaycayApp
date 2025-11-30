import { describe, it, expect } from 'vitest';
import { render } from '@/test-utils';
import RechartsLineGraph, {
  type LineConfig,
  type ReferenceLineConfig,
} from '@/components/CityPopup/graphs/RechartsLineGraph';

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
        cityKey="test-city"
        xAxisDataKey="month"
        yAxisLabel="Value"
        lines={basicLines}
      />
    );

    // should render the responsive container
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders with custom margins', () => {
    const { container } = render(
      <RechartsLineGraph
        data={mockData}
        cityKey="test-city"
        xAxisDataKey="month"
        yAxisLabel="Value"
        lines={basicLines}
        margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
      />
    );

    // should render the component
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders with x-axis label when provided', () => {
    const { container } = render(
      <RechartsLineGraph
        data={mockData}
        cityKey="test-city"
        xAxisDataKey="month"
        xAxisLabel="Months"
        yAxisLabel="Value"
        lines={basicLines}
      />
    );

    // should render the component
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
        cityKey="test-city"
        xAxisDataKey="month"
        yAxisLabel="Value"
        lines={multipleLines}
      />
    );

    // should render the component
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('renders without legend when showLegend is false', () => {
    const { container } = render(
      <RechartsLineGraph
        data={mockData}
        cityKey="test-city"
        xAxisDataKey="month"
        yAxisLabel="Value"
        lines={basicLines}
        showLegend={false}
      />
    );

    // should render the component
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
        cityKey="test-city"
        xAxisDataKey="month"
        yAxisLabel="Value"
        lines={basicLines}
        referenceLines={referenceLines}
      />
    );

    // should render the component
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });

  it('handles empty data array', () => {
    const { container } = render(
      <RechartsLineGraph
        data={[]}
        cityKey="test-city"
        xAxisDataKey="month"
        yAxisLabel="Value"
        lines={basicLines}
      />
    );

    // should still render the component
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
        cityKey="test-city"
        xAxisDataKey="month"
        yAxisLabel="Value"
        lines={complexLines}
      />
    );

    // should render the component
    expect(
      container.querySelector('.recharts-responsive-container')
    ).toBeInTheDocument();
  });
});
