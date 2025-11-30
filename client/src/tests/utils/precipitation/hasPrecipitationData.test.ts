import { describe, it, expect } from 'vitest';
import { hasPrecipitationData } from '@/utils/precipitation/hasPrecipitationData';
import type { CityWeeklyWeather } from '@/types/weeklyWeatherDataType';

describe('hasPrecipitationData', () => {
  it('returns false for null input', () => {
    expect(hasPrecipitationData(null)).toBe(false);
  });

  it('returns false for undefined input', () => {
    expect(hasPrecipitationData(undefined)).toBe(false);
  });

  it('returns false when all weeks have null precipitation', () => {
    const data: CityWeeklyWeather = {
      city: 'Khartoum',
      country: 'Sudan',
      state: null,
      lat: 15.5007,
      long: 32.5599,
      weeklyData: [
        {
          week: 1,
          avgTemp: 25,
          maxTemp: 30,
          minTemp: 20,
          totalPrecip: null,
          avgPrecip: null,
          daysWithRain: null,
          daysWithData: 7,
        },
        {
          week: 2,
          avgTemp: 26,
          maxTemp: 31,
          minTemp: 21,
          totalPrecip: null,
          avgPrecip: null,
          daysWithRain: null,
          daysWithData: 7,
        },
      ],
    };

    expect(hasPrecipitationData(data)).toBe(false);
  });

  it('returns true when at least one week has totalPrecip', () => {
    const data: CityWeeklyWeather = {
      city: 'London',
      country: 'United Kingdom',
      state: null,
      lat: 51.5074,
      long: -0.1278,
      weeklyData: [
        {
          week: 1,
          avgTemp: 10,
          maxTemp: 15,
          minTemp: 5,
          totalPrecip: 50,
          avgPrecip: null,
          daysWithRain: 3,
          daysWithData: 7,
        },
        {
          week: 2,
          avgTemp: 11,
          maxTemp: 16,
          minTemp: 6,
          totalPrecip: null,
          avgPrecip: null,
          daysWithRain: null,
          daysWithData: 7,
        },
      ],
    };

    expect(hasPrecipitationData(data)).toBe(true);
  });

  it('returns true when at least one week has avgPrecip', () => {
    const data: CityWeeklyWeather = {
      city: 'Seattle',
      country: 'United States',
      state: 'Washington',
      lat: 47.6062,
      long: -122.3321,
      weeklyData: [
        {
          week: 1,
          avgTemp: 12,
          maxTemp: 17,
          minTemp: 7,
          totalPrecip: null,
          avgPrecip: 5.5,
          daysWithRain: 4,
          daysWithData: 7,
        },
      ],
    };

    expect(hasPrecipitationData(data)).toBe(true);
  });

  it('returns true when weeks have both totalPrecip and avgPrecip', () => {
    const data: CityWeeklyWeather = {
      city: 'Portland',
      country: 'United States',
      state: 'Oregon',
      lat: 45.5152,
      long: -122.6784,
      weeklyData: [
        {
          week: 1,
          avgTemp: 13,
          maxTemp: 18,
          minTemp: 8,
          totalPrecip: 45,
          avgPrecip: 6.4,
          daysWithRain: 5,
          daysWithData: 7,
        },
      ],
    };

    expect(hasPrecipitationData(data)).toBe(true);
  });

  it('returns false for empty weeklyData array', () => {
    const data: CityWeeklyWeather = {
      city: 'Test City',
      country: 'Test Country',
      state: null,
      lat: 0,
      long: 0,
      weeklyData: [],
    };

    expect(hasPrecipitationData(data)).toBe(false);
  });
});
