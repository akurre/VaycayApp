import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import CityBadge from '@/components/CityPopup/graphs/CityBadge';

describe('CityBadge', () => {
  it('renders city name', () => {
    render(<CityBadge cityName="New York" />);
    expect(screen.getByText('New York')).toBeInTheDocument();
  });

  it('uses primary color for non-comparison', () => {
    const { container } = render(<CityBadge cityName="Paris" isComparison={false} />);
    const badge = container.querySelector('[class*="Badge"]');
    expect(badge).toBeInTheDocument();
  });

  it('uses secondary color for comparison city', () => {
    const { container } = render(<CityBadge cityName="London" isComparison={true} />);
    const badge = container.querySelector('[class*="Badge"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies margin bottom when specified', () => {
    render(<CityBadge cityName="Tokyo" mb={10} />);
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
  });
});
