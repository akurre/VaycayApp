import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import CitySearchResultRow from '@/components/CityPopup/CitySearchResultRow';
import type { SearchCitiesResult } from '@/types/userLocationType';

const tokyo: SearchCitiesResult = {
  id: 1,
  name: 'Tokyo',
  country: 'Japan',
  state: null,
  lat: 35.68,
  long: 139.69,
  population: 13_960_000,
};

const austin: SearchCitiesResult = {
  id: 2,
  name: 'Austin',
  country: 'United States',
  state: 'Texas',
  lat: 30.27,
  long: -97.74,
  population: 978_908,
};

describe('CitySearchResultRow', () => {
  describe('desktop variant', () => {
    it('renders city name and country', () => {
      render(
        <CitySearchResultRow city={tokyo} onClick={vi.fn()} variant="desktop" />
      );
      expect(screen.getByText('Tokyo')).toBeInTheDocument();
      expect(screen.getByText(/Japan/)).toBeInTheDocument();
    });

    it('renders state when present', () => {
      render(
        <CitySearchResultRow
          city={austin}
          onClick={vi.fn()}
          variant="desktop"
        />
      );
      expect(screen.getByText(/Texas/)).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(
        <CitySearchResultRow city={tokyo} onClick={onClick} variant="desktop" />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it('does not render add icon', () => {
      render(
        <CitySearchResultRow city={tokyo} onClick={vi.fn()} variant="desktop" />
      );
      expect(
        screen.queryByRole('img', { hidden: true })
      ).not.toBeInTheDocument();
    });
  });

  describe('mobile variant', () => {
    it('renders city name and country', () => {
      render(
        <CitySearchResultRow city={tokyo} onClick={vi.fn()} variant="mobile" />
      );
      expect(screen.getByText('Tokyo')).toBeInTheDocument();
      expect(screen.getByText(/Japan/)).toBeInTheDocument();
    });

    it('does not render add icon by default', () => {
      const { container } = render(
        <CitySearchResultRow city={tokyo} onClick={vi.fn()} variant="mobile" />
      );
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders add icon when showAddIcon is true', () => {
      const { container } = render(
        <CitySearchResultRow
          city={tokyo}
          onClick={vi.fn()}
          variant="mobile"
          showAddIcon
        />
      );
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(
        <CitySearchResultRow city={tokyo} onClick={onClick} variant="mobile" />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledOnce();
    });
  });
});
