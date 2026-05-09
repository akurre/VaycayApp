import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@/test-utils';
import TodayReadout from '@/components/CityPopup/Ribbon/TodayReadout';
import { DataType, TemperatureUnit } from '@/types/mapTypes';
import { useAppStore } from '@/stores/useAppStore';

describe('TodayReadout', () => {
  beforeEach(() => {
    useAppStore.setState({ temperatureUnit: TemperatureUnit.Celsius });
  });

  describe('per-tab formatting', () => {
    it('formats temperature values with the user’s temperature unit', () => {
      render(
        <TodayReadout
          tab={DataType.Temperature}
          c1Value={12.9}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('12.9°C')).toBeInTheDocument();
    });

    it('formats sunshine values as a "% sun" headline (rounded)', () => {
      render(
        <TodayReadout
          tab={DataType.Sunshine}
          c1Value={42.7}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('43% sun')).toBeInTheDocument();
    });

    it('rounds precip values to the nearest mm', () => {
      render(
        <TodayReadout
          tab={DataType.Precip}
          c1Value={40.4}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('40mm')).toBeInTheDocument();
    });

    it('renders a "X rainy days" sub-line under the precip headline', () => {
      render(
        <TodayReadout
          tab={DataType.Precip}
          c1Value={12}
          c2Value={null}
          subC1Value={3}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('12mm')).toBeInTheDocument();
      expect(screen.getByText('3 rainy days')).toBeInTheDocument();
    });

    it('uses the singular "1 rainy day" form when only one day rained', () => {
      render(
        <TodayReadout
          tab={DataType.Precip}
          c1Value={4}
          c2Value={null}
          subC1Value={1}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('1 rainy day')).toBeInTheDocument();
    });

    it('does not render a sub-line for tabs without one (sunshine static)', () => {
      render(
        <TodayReadout
          tab={DataType.Sunshine}
          c1Value={42}
          c2Value={null}
          subC1Value={5}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.queryByText('5')).not.toBeInTheDocument();
      expect(screen.queryByText(/rainy day/)).not.toBeInTheDocument();
    });
  });

  describe('label prefix per tab', () => {
    it('uses "On this day" for the temperature tab', () => {
      render(
        <TodayReadout
          tab={DataType.Temperature}
          c1Value={12.9}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText(/On this day · May 6/)).toBeInTheDocument();
    });

    it('uses "In this month" + "daylight" suffix for the sunshine tab', () => {
      render(
        <TodayReadout
          tab={DataType.Sunshine}
          c1Value={42}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(
        screen.getByText('In this month · May 6 · daylight')
      ).toBeInTheDocument();
    });

    it('uses "In this week" for the precip tab', () => {
      render(
        <TodayReadout
          tab={DataType.Precip}
          c1Value={12}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('In this week · May 6')).toBeInTheDocument();
    });
  });

  describe('placeholders', () => {
    it('renders an em-dash for null values', () => {
      render(
        <TodayReadout
          tab={DataType.Temperature}
          c1Value={null}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('comparison mode', () => {
    it('renders both values when hasComparison is true', () => {
      render(
        <TodayReadout
          tab={DataType.Temperature}
          c1Value={12.9}
          c2Value={17.6}
          subC1Value={null}
          subC2Value={null}
          hasComparison={true}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('12.9°C')).toBeInTheDocument();
      expect(screen.getByText('17.6°C')).toBeInTheDocument();
    });

    it('hides the second value when hasComparison is false even if c2Value is provided', () => {
      render(
        <TodayReadout
          tab={DataType.Temperature}
          c1Value={12.9}
          c2Value={17.6}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.queryByText('17.6°C')).not.toBeInTheDocument();
    });

    it('renders both rainy-day sub-lines in precip comparison mode', () => {
      render(
        <TodayReadout
          tab={DataType.Precip}
          c1Value={12}
          c2Value={4}
          subC1Value={3}
          subC2Value={1}
          hasComparison={true}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('3 rainy days')).toBeInTheDocument();
      expect(screen.getByText('1 rainy day')).toBeInTheDocument();
    });
  });

  describe('hover override', () => {
    it('uses the hover label and pre-formatted strings when hover is provided', () => {
      render(
        <TodayReadout
          tab={DataType.Sunshine}
          c1Value={42}
          c2Value={31}
          subC1Value={null}
          subC2Value={null}
          hasComparison={true}
          selectedDate="2026-05-06"
          hover={{
            label: 'May',
            v1: '43% sun',
            v2: '28% sun',
          }}
        />
      );

      expect(screen.getByText('May · daylight')).toBeInTheDocument();
      expect(screen.getByText('43% sun')).toBeInTheDocument();
      expect(screen.getByText('28% sun')).toBeInTheDocument();
    });

    it('does not append a valueLabel for tabs without one (temperature)', () => {
      render(
        <TodayReadout
          tab={DataType.Temperature}
          c1Value={12.9}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.queryByText(/daylight/)).not.toBeInTheDocument();
    });
  });

  describe('label date fallback', () => {
    it('falls back to the raw selectedDate string when it is not a recognised date format', () => {
      render(
        <TodayReadout
          tab={DataType.Temperature}
          c1Value={20}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="W22"
          hover={null}
        />
      );

      expect(screen.getByText(/W22/)).toBeInTheDocument();
    });
  });

  describe('comparison mode with null city 2 value', () => {
    it('renders em-dash for city 2 when hasComparison is true but c2Value is null', () => {
      render(
        <TodayReadout
          tab={DataType.Temperature}
          c1Value={12.9}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={true}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('12.9°C')).toBeInTheDocument();
      const emDashes = screen.getAllByText('—');
      expect(emDashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('hover sub values', () => {
    it('renders subV1 stacked under v1 when provided', () => {
      render(
        <TodayReadout
          tab={DataType.Sunshine}
          c1Value={null}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={{
            label: 'Jul',
            v1: '32% sun',
            v2: null,
            subV1: '187h',
          }}
        />
      );

      expect(screen.getByText('32% sun')).toBeInTheDocument();
      expect(screen.getByText('187h')).toBeInTheDocument();
    });

    it('hides subV2 when hasComparison is false even if provided', () => {
      render(
        <TodayReadout
          tab={DataType.Sunshine}
          c1Value={null}
          c2Value={null}
          subC1Value={null}
          subC2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={{
            label: 'Jul',
            v1: '32% sun',
            v2: '28% sun',
            subV1: '187h',
            subV2: '160h',
          }}
        />
      );

      expect(screen.getByText('187h')).toBeInTheDocument();
      expect(screen.queryByText('160h')).not.toBeInTheDocument();
    });
  });
});
