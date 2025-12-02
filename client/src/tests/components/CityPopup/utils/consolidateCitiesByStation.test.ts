import { describe, it, expect } from 'vitest';
import { consolidateWeatherByCity } from '../../../../utils/data/consolidateWeatherByCity';
import { consolidateSunshineByCity } from '../../../../utils/data/consolidateSunshineByCity';
import type { WeatherData } from '@/types/cityWeatherDataType';
import type { SunshineData } from '@/types/sunshineDataType';

describe('consolidateWeatherByCity', () => {
  it('should return single station data unchanged', () => {
    const input: WeatherData[] = [
      {
        cityId: 1,
        city: 'Paris',
        country: 'France',
        state: null,
        suburb: null,
        date: '03-15',
        lat: 48.8566,
        long: 2.3522,
        population: 2165000,
        precipitation: 5.2,
        snowDepth: 0,
        avgTemperature: 12.5,
        maxTemperature: 15,
        minTemperature: 10,
        stationName: 'Paris Station',
        submitterId: null,
      },
    ];

    const result = consolidateWeatherByCity(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(input[0]);
  });

  it('should consolidate multiple stations for the same city (same cityId)', () => {
    const input: WeatherData[] = [
      {
        cityId: 1223,
        city: 'Berlin',
        country: 'Germany',
        state: null,
        suburb: null,
        date: '03-15',
        lat: 52.5167,
        long: 13.3833,
        population: 3500000,
        precipitation: 2,
        snowDepth: 0,
        avgTemperature: 15.2,
        maxTemperature: 18,
        minTemperature: 12,
        stationName: 'Berlin Weather Station',
        submitterId: null,
      },
      {
        cityId: 1223,
        city: 'Berlin',
        country: 'Germany',
        state: null,
        suburb: null,
        date: '03-15',
        lat: 52.5167,
        long: 13.3833,
        population: 3500000,
        precipitation: 3,
        snowDepth: 0,
        avgTemperature: 14.8,
        maxTemperature: 17,
        minTemperature: 13,
        stationName: 'Potsdam Weather Station',
        submitterId: null,
      },
    ];

    const result = consolidateWeatherByCity(input);

    expect(result).toHaveLength(1);
    expect(result[0].cityId).toBe(1223);
    expect(result[0].city).toBe('Berlin');
    expect(result[0].avgTemperature).toBeCloseTo(15, 5); // (15.2 + 14.8) / 2
    expect(result[0].maxTemperature).toBeCloseTo(17.5, 5); // (18 + 17) / 2
    expect(result[0].minTemperature).toBeCloseTo(12.5, 5); // (12 + 13) / 2
    expect(result[0].precipitation).toBeCloseTo(2.5, 5); // (2 + 3) / 2
    expect(result[0].stationName).toBe('Berlin (2 stations avg)');
  });

  it('should handle null values correctly', () => {
    const input: WeatherData[] = [
      {
        cityId: 2,
        city: 'Tokyo',
        country: 'Japan',
        state: null,
        suburb: null,
        date: '03-15',
        lat: 35.6762,
        long: 139.6503,
        population: 13960000,
        precipitation: 10,
        snowDepth: null,
        avgTemperature: 12,
        maxTemperature: 16,
        minTemperature: 8,
        stationName: 'Station 1',
        submitterId: null,
      },
      {
        cityId: 2,
        city: 'Tokyo',
        country: 'Japan',
        state: null,
        suburb: null,
        date: '03-15',
        lat: 35.6762,
        long: 139.6503,
        population: 13960000,
        precipitation: null,
        snowDepth: null,
        avgTemperature: 14,
        maxTemperature: null,
        minTemperature: 10,
        stationName: 'Station 2',
        submitterId: null,
      },
    ];

    const result = consolidateWeatherByCity(input);

    expect(result).toHaveLength(1);
    expect(result[0].avgTemperature).toBeCloseTo(13, 5); // (12 + 14) / 2
    expect(result[0].maxTemperature).toBe(16); // Only one non-null value
    expect(result[0].minTemperature).toBeCloseTo(9, 5); // (8 + 10) / 2
    expect(result[0].precipitation).toBe(10); // Only one non-null value
    expect(result[0].snowDepth).toBe(null); // All null values
  });

  it('should handle cities with the same name in different countries (different cityIds)', () => {
    const input: WeatherData[] = [
      {
        cityId: 3,
        city: 'London',
        country: 'United Kingdom',
        state: null,
        suburb: null,
        date: '03-15',
        lat: 51.5074,
        long: -0.1278,
        population: 8982000,
        precipitation: 5,
        snowDepth: 0,
        avgTemperature: 10,
        maxTemperature: 13,
        minTemperature: 7,
        stationName: 'UK Station',
        submitterId: null,
      },
      {
        cityId: 4,
        city: 'London',
        country: 'Canada',
        state: 'Ontario',
        suburb: null,
        date: '03-15',
        lat: 42.9834,
        long: -81.2497,
        population: 383822,
        precipitation: 3,
        snowDepth: 2,
        avgTemperature: -2,
        maxTemperature: 2,
        minTemperature: -6,
        stationName: 'Canada Station',
        submitterId: null,
      },
    ];

    const result = consolidateWeatherByCity(input);

    // Should keep both cities separate (different cityIds)
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.cityId === 3)).toBeDefined();
    expect(result.find((r) => r.cityId === 4)).toBeDefined();
  });
});

describe('consolidateSunshineByCity', () => {
  it('should return single station data unchanged', () => {
    const input: SunshineData[] = [
      {
        cityId: 1,
        city: 'Barcelona',
        country: 'Spain',
        state: 'Catalonia',
        suburb: undefined,
        lat: 41.3851,
        long: 2.1734,
        population: 1620000,
        jan: 149,
        feb: 156,
        mar: 186,
        apr: 220,
        may: 244,
        jun: 270,
        jul: 310,
        aug: 282,
        sep: 219,
        oct: 180,
        nov: 149,
        dec: 138,
        stationName: 'Barcelona Station',
      },
    ];

    const result = consolidateSunshineByCity(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(input[0]);
  });

  it('should consolidate multiple stations for the same city (same cityId)', () => {
    const input: SunshineData[] = [
      {
        cityId: 2,
        city: 'Rome',
        country: 'Italy',
        lat: 41.9028,
        long: 12.4964,
        population: 2873000,
        jan: 120,
        feb: 132,
        mar: 170,
        apr: 210,
        may: 260,
        jun: 285,
        jul: 332,
        aug: 303,
        sep: 237,
        oct: 198,
        nov: 138,
        dec: 117,
        stationName: 'Station 1',
      },
      {
        cityId: 2,
        city: 'Rome',
        country: 'Italy',
        lat: 41.9028,
        long: 12.4964,
        population: 2873000,
        jan: 130,
        feb: 140,
        mar: 180,
        apr: 220,
        may: 270,
        jun: 295,
        jul: 340,
        aug: 310,
        sep: 245,
        oct: 210,
        nov: 145,
        dec: 125,
        stationName: 'Station 2',
      },
    ];

    const result = consolidateSunshineByCity(input);

    expect(result).toHaveLength(1);
    expect(result[0].cityId).toBe(2);
    expect(result[0].city).toBe('Rome');
    expect(result[0].jan).toBeCloseTo(125, 5); // (120 + 130) / 2
    expect(result[0].feb).toBeCloseTo(136, 5); // (132 + 140) / 2
    expect(result[0].jul).toBeCloseTo(336, 5); // (332 + 340) / 2
    expect(result[0].stationName).toBe('Rome (2 stations avg)');
  });

  it('should handle null values correctly', () => {
    const input: SunshineData[] = [
      {
        cityId: 3,
        city: 'Oslo',
        country: 'Norway',
        lat: 59.9139,
        long: 10.7522,
        population: 697010,
        jan: 40,
        feb: 72,
        mar: null,
        apr: 178,
        may: 240,
        jun: 257,
        jul: 268,
        aug: 217,
        sep: 138,
        oct: 86,
        nov: 42,
        dec: 28,
        stationName: 'Station 1',
      },
      {
        cityId: 3,
        city: 'Oslo',
        country: 'Norway',
        lat: 59.9139,
        long: 10.7522,
        population: 697010,
        jan: 45,
        feb: null,
        mar: 120,
        apr: 182,
        may: null,
        jun: 260,
        jul: 272,
        aug: 220,
        sep: 142,
        oct: 90,
        nov: null,
        dec: 32,
        stationName: 'Station 2',
      },
    ];

    const result = consolidateSunshineByCity(input);

    expect(result).toHaveLength(1);
    expect(result[0].jan).toBeCloseTo(42.5, 5); // (40 + 45) / 2
    expect(result[0].feb).toBe(72); // Only one non-null value
    expect(result[0].mar).toBe(120); // Only one non-null value
    expect(result[0].may).toBe(240); // Only one non-null value
    expect(result[0].jul).toBeCloseTo(270, 5); // (268 + 272) / 2
  });
});
