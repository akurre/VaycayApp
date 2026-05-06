import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test-utils';
import SunStatValue from '@/components/CityPopup/Ribbon/SunStatValue';

describe('SunStatValue', () => {
  it('renders only hours when latitude is null (no percentage possible)', () => {
    render(<SunStatValue averageMonthlyHours={216} latitude={null} />);
    expect(screen.getByText('216h')).toBeInTheDocument();
    expect(screen.queryByText(/% sun/)).not.toBeInTheDocument();
  });

  it('renders an em-dash when hours are null', () => {
    render(<SunStatValue averageMonthlyHours={null} latitude={41.4} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText(/% sun/)).not.toBeInTheDocument();
  });

  it('renders hours and percentage when both hours and latitude are provided', () => {
    // Barcelona-ish lat with avg ~216h/month → roughly 50–60% of theoretical max
    render(<SunStatValue averageMonthlyHours={216} latitude={41.4} />);
    expect(screen.getByText('216h')).toBeInTheDocument();
    expect(screen.getByText(/% sun$/)).toBeInTheDocument();
  });

  it('rounds hours to whole number', () => {
    render(<SunStatValue averageMonthlyHours={215.7} latitude={41.4} />);
    expect(screen.getByText('216h')).toBeInTheDocument();
  });
});
