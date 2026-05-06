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
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('12.9°C')).toBeInTheDocument();
    });

    it('formats sunshine values to one decimal place with an h suffix', () => {
      render(
        <TodayReadout
          tab={DataType.Sunshine}
          c1Value={15.1}
          c2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('15.1h')).toBeInTheDocument();
    });

    it('rounds precip values to the nearest mm', () => {
      render(
        <TodayReadout
          tab={DataType.Precip}
          c1Value={40.4}
          c2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText('40mm')).toBeInTheDocument();
    });
  });

  describe('placeholders', () => {
    it('renders an em-dash for null values', () => {
      render(
        <TodayReadout
          tab={DataType.Temperature}
          c1Value={null}
          c2Value={null}
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
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.queryByText('17.6°C')).not.toBeInTheDocument();
    });
  });

  describe('hover override', () => {
    it('uses the hover label and pre-formatted strings when hover is provided', () => {
      render(
        <TodayReadout
          tab={DataType.Sunshine}
          c1Value={15.1}
          c2Value={9.0}
          hasComparison={true}
          selectedDate="2026-05-06"
          hover={{
            label: 'Week 22',
            v1: '14.0h',
            v2: '8.5h',
          }}
        />
      );

      expect(screen.getByText('Week 22 · daylight')).toBeInTheDocument();
      expect(screen.getByText('14.0h')).toBeInTheDocument();
      expect(screen.getByText('8.5h')).toBeInTheDocument();
      // not the today values
      expect(screen.queryByText('15.1h')).not.toBeInTheDocument();
    });

    it('appends the per-tab valueLabel when present (sunshine → daylight)', () => {
      render(
        <TodayReadout
          tab={DataType.Sunshine}
          c1Value={15.1}
          c2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.getByText(/daylight/)).toBeInTheDocument();
    });

    it('does not append a valueLabel for tabs without one (temperature)', () => {
      render(
        <TodayReadout
          tab={DataType.Temperature}
          c1Value={12.9}
          c2Value={null}
          hasComparison={false}
          selectedDate="2026-05-06"
          hover={null}
        />
      );

      expect(screen.queryByText(/daylight/)).not.toBeInTheDocument();
    });
  });
});
