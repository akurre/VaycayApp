import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import AddComparisonCityButton from '@/components/CityPopup/AddComparisonCityButton';
import { PopupVariant } from '@/types/cityPopupTypes';

describe('AddComparisonCityButton', () => {
  it('renders a button with accessible label', () => {
    render(<AddComparisonCityButton onClick={vi.fn()} variant={PopupVariant.Desktop} />);
    expect(
      screen.getByRole('button', { name: 'Add comparison city' })
    ).toBeInTheDocument();
  });

  it('renders the Compare label', () => {
    render(<AddComparisonCityButton onClick={vi.fn()} variant={PopupVariant.Desktop} />);
    expect(screen.getByText('Compare')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<AddComparisonCityButton onClick={onClick} variant={PopupVariant.Desktop} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Add comparison city' })
    );
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders without error for mobile variant', () => {
    render(<AddComparisonCityButton onClick={vi.fn()} variant={PopupVariant.Mobile} />);
    expect(
      screen.getByRole('button', { name: 'Add comparison city' })
    ).toBeInTheDocument();
  });
});
