import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import MapTooltip from '@/components/Map/MapTooltip';

describe('MapTooltip', () => {
  describe('content', () => {
    it('renders the content text', () => {
      render(<MapTooltip x={50} y={50} content="Tokyo, Japan\n26°C" />);
      expect(screen.getByText(/Tokyo, Japan/)).toBeInTheDocument();
    });
  });

  describe('without onView (desktop hover)', () => {
    it('does not render a + button', () => {
      render(<MapTooltip x={50} y={50} content="Tokyo, Japan" />);
      expect(
        screen.queryByRole('button', { name: 'Open city details' })
      ).not.toBeInTheDocument();
    });
  });

  describe('with onView (mobile tap)', () => {
    it('renders a + button', () => {
      render(
        <MapTooltip
          x={50}
          y={50}
          content="Tokyo, Japan"
          onView={vi.fn()}
        />
      );
      expect(
        screen.getByRole('button', { name: 'Open city details' })
      ).toBeInTheDocument();
    });

    it('calls onView when the + button is clicked', () => {
      const onView = vi.fn();
      render(
        <MapTooltip x={50} y={50} content="Tokyo, Japan" onView={onView} />
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Open city details' })
      );
      expect(onView).toHaveBeenCalledOnce();
    });
  });
});
