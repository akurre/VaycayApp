import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import CityNameRow from '@/components/CityPopup/Ribbon/CityNameRow';

describe('CityNameRow', () => {
  it('renders the city name', () => {
    render(<CityNameRow color="#000" name="Berlin" lat={52.5} />);

    expect(screen.getByText('Berlin')).toBeInTheDocument();
  });

  it('renders the lat-suffix zone pill when latitude is provided', () => {
    render(<CityNameRow color="#000" name="Berlin" lat={52.5} />);

    // 52.5° rounds to 53°N
    expect(screen.getByText(/53°N/)).toBeInTheDocument();
  });

  it('omits the zone pill when latitude is null', () => {
    const { container } = render(
      <CityNameRow color="#000" name="Unknown" lat={null} />
    );

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(container.querySelector('span.uppercase')).not.toBeInTheDocument();
  });

  it('renders the color dot via inline style background', () => {
    const { container } = render(
      <CityNameRow color="#abc123" name="Berlin" lat={null} />
    );

    const dot = container.querySelector('span.rounded-full');
    expect(dot).toBeInTheDocument();
    expect(dot?.getAttribute('style')).toContain('#abc123');
  });

  it('adds cursor-pointer class and role=button when onClick is provided', () => {
    const handleClick = vi.fn();
    render(<CityNameRow color="#000" name="Berlin" lat={null} onClick={handleClick} />);

    const heading = screen.getByRole('button', { name: 'Berlin' });
    expect(heading).toBeInTheDocument();
  });

  it('calls onClick when Enter is pressed on the heading', () => {
    const handleClick = vi.fn();
    render(<CityNameRow color="#000" name="Berlin" lat={null} onClick={handleClick} />);

    const heading = screen.getByRole('button', { name: 'Berlin' });
    fireEvent.keyDown(heading, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick when Space is pressed on the heading', () => {
    const handleClick = vi.fn();
    render(<CityNameRow color="#000" name="Berlin" lat={null} onClick={handleClick} />);

    const heading = screen.getByRole('button', { name: 'Berlin' });
    fireEvent.keyDown(heading, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when other keys are pressed', () => {
    const handleClick = vi.fn();
    render(<CityNameRow color="#000" name="Berlin" lat={null} onClick={handleClick} />);

    const heading = screen.getByRole('button', { name: 'Berlin' });
    fireEvent.keyDown(heading, { key: 'Escape' });
    expect(handleClick).not.toHaveBeenCalled();
  });
});
