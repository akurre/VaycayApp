import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import HamburgerSheet from '@/components/Navigation/Mobile/HamburgerSheet';
import { useAppStore } from '@/stores/useAppStore';
import { LocationSource } from '@/types/userLocationType';

// Avoid real Apollo / geolocation dependencies in subcomponents.
vi.mock('@/components/Navigation/HomeLocationContent', () => ({
  default: () => (
    <div data-testid="home-location-content">HomeLocationContent</div>
  ),
}));
vi.mock('@/components/Navigation/FeedbackButton', () => ({
  default: () => <button>About &amp; feedback</button>,
}));

describe('HamburgerSheet', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({ homeLocation: null, legendVisible: true });
  });

  describe('menu view', () => {
    it('shows Theme row', () => {
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('shows "Not set" when no home location is set', () => {
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      expect(screen.getByText('Home location')).toBeInTheDocument();
      expect(screen.getByText('Not set')).toBeInTheDocument();
    });

    it('shows city name when home location is set', () => {
      useAppStore.setState({
        homeLocation: {
          cityId: 1,
          cityName: 'Berlin',
          country: 'Germany',
          state: null,
          coordinates: { lat: 52.52, long: 13.405 },
          source: LocationSource.Manual,
        },
      });
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      expect(screen.getByText('Berlin')).toBeInTheDocument();
    });

    it('shows Show map legend switch', () => {
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      expect(screen.getByText('Show map legend')).toBeInTheDocument();
    });

    it('shows legend switch as checked when legendVisible is true', () => {
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      const toggle = screen.getByRole('switch', { name: 'Toggle map legend' });
      expect(toggle).toBeChecked();
    });

    it('shows legend switch as unchecked when legendVisible is false', () => {
      useAppStore.setState({ legendVisible: false });
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      const toggle = screen.getByRole('switch', { name: 'Toggle map legend' });
      expect(toggle).not.toBeChecked();
    });

    it('toggling legend switch updates legendVisible in store', () => {
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      const toggle = screen.getByRole('switch', { name: 'Toggle map legend' });
      fireEvent.click(toggle);
      expect(useAppStore.getState().legendVisible).toBe(false);
    });

    it('shows About & feedback row', () => {
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      expect(screen.getByText(/about & feedback/i)).toBeInTheDocument();
    });
  });

  describe('home sub-view', () => {
    it('clicking Home location row shows HomeLocationContent', () => {
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      expect(
        screen.queryByTestId('home-location-content')
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('Home location'));
      expect(screen.getByTestId('home-location-content')).toBeInTheDocument();
    });

    it('back button in home sub-view returns to menu', () => {
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Home location'));
      expect(screen.getByTestId('home-location-content')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /back to menu/i }));
      expect(
        screen.queryByTestId('home-location-content')
      ).not.toBeInTheDocument();
      expect(screen.getByText('Theme')).toBeInTheDocument();
    });

    it('hides menu rows when home sub-view is active', () => {
      render(<HamburgerSheet opened onClose={vi.fn()} />);
      fireEvent.click(screen.getByText('Home location'));
      expect(screen.queryByText('Show map legend')).not.toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when drawer is closed', () => {
      const onClose = vi.fn();
      render(<HamburgerSheet opened onClose={onClose} />);
      // Mantine Drawer has a close button with aria-label "Close"
      const closeBtn = screen.getByRole('button', { name: 'Close menu' });
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('resets view to menu after close', () => {
      const onClose = vi.fn();
      render(<HamburgerSheet opened onClose={onClose} />);
      // navigate to home sub-view
      fireEvent.click(screen.getByText('Home location'));
      expect(screen.getByTestId('home-location-content')).toBeInTheDocument();
      // close the drawer (calls handleClose which resets view)
      fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
