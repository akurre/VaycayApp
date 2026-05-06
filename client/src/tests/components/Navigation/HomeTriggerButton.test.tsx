import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import HomeTriggerButton from '@/components/Navigation/HomeTriggerButton';
import { useAppStore } from '@/stores/useAppStore';
import { LocationSource } from '@/types/userLocationType';

describe('HomeTriggerButton', () => {
  beforeEach(() => {
    useAppStore.setState({ homeLocation: null });
  });

  it('falls back to "Set Home" when no home location is set', () => {
    render(<HomeTriggerButton isOpen={false} />);
    expect(screen.getByRole('button')).toHaveTextContent('Set Home');
  });

  it('renders "City, Country" when a home location is set', () => {
    useAppStore.setState({
      homeLocation: {
        cityId: 1,
        cityName: 'New York',
        country: 'United States',
        state: 'New York',
        coordinates: { lat: 40.7128, long: -74.006 },
        source: LocationSource.Manual,
      },
    });
    render(<HomeTriggerButton isOpen={false} />);
    expect(screen.getByRole('button')).toHaveTextContent(
      'New York, United States'
    );
  });

  it('renders a button regardless of isOpen', () => {
    const { rerender } = render(<HomeTriggerButton isOpen={false} />);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<HomeTriggerButton isOpen={true} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
