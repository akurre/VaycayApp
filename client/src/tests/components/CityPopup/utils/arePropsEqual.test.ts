import { describe, it, expect, vi } from 'vitest';
import arePropsEqual from '@/components/CityPopup/utils/arePropsEqual';
import type { CityPopupProps } from '@/types/mapTypes';
import { DataType } from '@/types/mapTypes';
import { createMockWeatherData, createMockSunshineData } from '@/test-utils';

describe('arePropsEqual', () => {
  const mockCity = createMockWeatherData();
  const mockOnClose = vi.fn();

  const baseProps: CityPopupProps = {
    city: mockCity,
    selectedMonth: 7,
    selectedDate: '2024-07-15',
    onClose: mockOnClose,
    dataType: DataType.Temperature,
  };

  it('returns true when props are identical (same reference)', () => {
    const prevProps = baseProps;
    const nextProps = baseProps;

    expect(arePropsEqual(prevProps, nextProps)).toBe(true);
  });

  it('returns true when city is the same reference', () => {
    const prevProps: CityPopupProps = {
      ...baseProps,
    };
    const nextProps: CityPopupProps = {
      ...baseProps,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(true);
  });

  it('returns true when city properties are equal', () => {
    const city1 = createMockWeatherData();
    const city2 = createMockWeatherData();

    const prevProps: CityPopupProps = {
      ...baseProps,
      city: city1,
    };
    const nextProps: CityPopupProps = {
      ...baseProps,
      city: city2,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(true);
  });

  it('returns false when city name is different', () => {
    const city1 = createMockWeatherData({ city: 'Paris' });
    const city2 = createMockWeatherData({ city: 'London' });

    const prevProps: CityPopupProps = {
      ...baseProps,
      city: city1,
    };
    const nextProps: CityPopupProps = {
      ...baseProps,
      city: city2,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });

  it('returns false when country is different', () => {
    const city1 = createMockWeatherData({ country: 'France' });
    const city2 = createMockWeatherData({ country: 'UK' });

    const prevProps: CityPopupProps = {
      ...baseProps,
      city: city1,
    };
    const nextProps: CityPopupProps = {
      ...baseProps,
      city: city2,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });

  it('returns false when lat is different', () => {
    const city1 = createMockWeatherData({ lat: 48.8566 });
    const city2 = createMockWeatherData({ lat: 51.5074 });

    const prevProps: CityPopupProps = {
      ...baseProps,
      city: city1,
    };
    const nextProps: CityPopupProps = {
      ...baseProps,
      city: city2,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });

  it('returns false when long is different', () => {
    const city1 = createMockWeatherData({ long: 2.3522 });
    const city2 = createMockWeatherData({ long: -0.1278 });

    const prevProps: CityPopupProps = {
      ...baseProps,
      city: city1,
    };
    const nextProps: CityPopupProps = {
      ...baseProps,
      city: city2,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });

  it('returns false when prevCity is null', () => {
    const prevProps: CityPopupProps = {
      ...baseProps,
      city: null,
    };
    const nextProps: CityPopupProps = {
      ...baseProps,
      city: mockCity,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });

  it('returns false when nextCity is null', () => {
    const prevProps: CityPopupProps = {
      ...baseProps,
      city: mockCity,
    };
    const nextProps: CityPopupProps = {
      ...baseProps,
      city: null,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });

  it('returns false when selectedMonth is different', () => {
    const city1 = createMockWeatherData();
    const city2 = createMockWeatherData();
    const onClose = vi.fn();

    const prevProps: CityPopupProps = {
      city: city1,
      selectedMonth: 7,
      selectedDate: '2024-07-15',
      onClose,
      dataType: DataType.Temperature,
    };
    const nextProps: CityPopupProps = {
      city: city2,
      selectedMonth: 8,
      selectedDate: '2024-07-15',
      onClose,
      dataType: DataType.Temperature,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });

  it('returns false when selectedDate is different', () => {
    const city1 = createMockWeatherData();
    const city2 = createMockWeatherData();
    const onClose = vi.fn();

    const prevProps: CityPopupProps = {
      city: city1,
      selectedMonth: 7,
      selectedDate: '2024-07-15',
      onClose,
      dataType: DataType.Temperature,
    };
    const nextProps: CityPopupProps = {
      city: city2,
      selectedMonth: 7,
      selectedDate: '2024-07-16',
      onClose,
      dataType: DataType.Temperature,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });

  it('returns false when onClose is different', () => {
    const city1 = createMockWeatherData();
    const city2 = createMockWeatherData();
    const onClose1 = vi.fn();
    const onClose2 = vi.fn();

    const prevProps: CityPopupProps = {
      city: city1,
      selectedMonth: 7,
      selectedDate: '2024-07-15',
      onClose: onClose1,
      dataType: DataType.Temperature,
    };
    const nextProps: CityPopupProps = {
      city: city2,
      selectedMonth: 7,
      selectedDate: '2024-07-15',
      onClose: onClose2,
      dataType: DataType.Temperature,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });

  it('returns false when dataType is different', () => {
    const city1 = createMockWeatherData();
    const city2 = createMockWeatherData();
    const onClose = vi.fn();

    const prevProps: CityPopupProps = {
      city: city1,
      selectedMonth: 7,
      selectedDate: '2024-07-15',
      onClose,
      dataType: DataType.Temperature,
    };
    const nextProps: CityPopupProps = {
      city: city2,
      selectedMonth: 7,
      selectedDate: '2024-07-15',
      onClose,
      dataType: DataType.Sunshine,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });

  it('works with SunshineData type', () => {
    const sunshineCity1 = createMockSunshineData();
    const sunshineCity2 = createMockSunshineData();

    const prevProps: CityPopupProps = {
      ...baseProps,
      city: sunshineCity1,
    };
    const nextProps: CityPopupProps = {
      ...baseProps,
      city: sunshineCity2,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(true);
  });

  it('returns false when SunshineData cities have different properties', () => {
    const sunshineCity1 = createMockSunshineData({ city: 'Barcelona' });
    const sunshineCity2 = createMockSunshineData({ city: 'Madrid' });

    const prevProps: CityPopupProps = {
      ...baseProps,
      city: sunshineCity1,
    };
    const nextProps: CityPopupProps = {
      ...baseProps,
      city: sunshineCity2,
    };

    expect(arePropsEqual(prevProps, nextProps)).toBe(false);
  });
});
