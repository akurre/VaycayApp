import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import HamburgerHomeSubview from '@/components/Navigation/Mobile/HamburgerHomeSubview';

vi.mock('@/components/Navigation/HomeLocationContent', () => ({
  default: () => (
    <div data-testid="home-location-content">HomeLocationContent</div>
  ),
}));

describe('HamburgerHomeSubview', () => {
  it('renders HomeLocationContent', () => {
    render(<HamburgerHomeSubview onBack={vi.fn()} />);
    expect(screen.getByTestId('home-location-content')).toBeInTheDocument();
  });

  it('renders back button with accessible label', () => {
    render(<HamburgerHomeSubview onBack={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Back to menu' })
    ).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<HamburgerHomeSubview onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to menu' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders "Home Location" heading', () => {
    render(<HamburgerHomeSubview onBack={vi.fn()} />);
    expect(screen.getByText('Home Location')).toBeInTheDocument();
  });
});
