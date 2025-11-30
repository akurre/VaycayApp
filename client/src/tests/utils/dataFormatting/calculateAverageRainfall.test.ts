import { describe, it, expect } from 'vitest';
import { calculateAverageRainfall } from '@/utils/dataFormatting/calculateAverageRainfall';
import type { WeekDataPoint } from '@/types/weeklyWeatherDataType';

describe('calculateAverageRainfall', () => {
  it('should calculate average rainfall for valid data', () => {
    const weeklyData: WeekDataPoint[] = [
      {
        week: 1,
        totalPrecip: 70,
        daysWithData: 7,
        avgTemp: 5,
        minTemp: 0,
        maxTemp: 10,
        avgPrecip: 10,
        daysWithRain: 3,
      },
      {
        week: 2,
        totalPrecip: 140,
        daysWithData: 14,
        avgTemp: 5,
        minTemp: 0,
        maxTemp: 10,
        avgPrecip: 10,
        daysWithRain: 3,
      },
    ];

    const result = calculateAverageRainfall(weeklyData);
    // Week 1: (70 / 7) * 7 = 70
    // Week 2: (140 / 14) * 7 = 70
    // Total: 140
    expect(result).toBe(140);
  });

  it('should filter out null totalPrecip values', () => {
    const weeklyData: WeekDataPoint[] = [
      {
        week: 1,
        totalPrecip: 70,
        daysWithData: 7,
        avgTemp: 5,
        minTemp: 0,
        maxTemp: 10,
        avgPrecip: 10,
        daysWithRain: 3,
      },
      {
        week: 2,
        totalPrecip: null,
        daysWithData: 7,
        avgTemp: 5,
        minTemp: 0,
        maxTemp: 10,
        avgPrecip: 10,
        daysWithRain: 3,
      },
    ];

    const result = calculateAverageRainfall(weeklyData);
    expect(result).toBe(70);
  });

  it('should filter out weeks with zero daysWithData', () => {
    const weeklyData: WeekDataPoint[] = [
      {
        week: 1,
        totalPrecip: 70,
        daysWithData: 7,
        avgTemp: 5,
        minTemp: 0,
        maxTemp: 10,
        avgPrecip: 10,
        daysWithRain: 3,
      },
      {
        week: 2,
        totalPrecip: 100,
        daysWithData: 0,
        avgTemp: 5,
        minTemp: 0,
        maxTemp: 10,
        avgPrecip: 10,
        daysWithRain: 3,
      },
    ];

    const result = calculateAverageRainfall(weeklyData);
    expect(result).toBe(70);
  });

  it('should return null for empty data', () => {
    const result = calculateAverageRainfall([]);
    expect(result).toBeNull();
  });

  it('should return null when all data is invalid', () => {
    const weeklyData: WeekDataPoint[] = [
      {
        week: 1,
        totalPrecip: null,
        daysWithData: 7,
        avgTemp: 5,
        minTemp: 0,
        maxTemp: 10,
        avgPrecip: 10,
        daysWithRain: 3,
      },
      {
        week: 2,
        totalPrecip: 100,
        daysWithData: 0,
        avgTemp: 5,
        minTemp: 0,
        maxTemp: 10,
        avgPrecip: 10,
        daysWithRain: 3,
      },
    ];

    const result = calculateAverageRainfall(weeklyData);
    expect(result).toBeNull();
  });

  it('should correctly normalize data with varying daysWithData', () => {
    const weeklyData: WeekDataPoint[] = [
      {
        week: 1,
        totalPrecip: 35,
        daysWithData: 7,
        avgTemp: 5,
        minTemp: 0,
        maxTemp: 10,
        avgPrecip: 5,
        daysWithRain: 3,
      },
      {
        week: 2,
        totalPrecip: 30,
        daysWithData: 3,
        avgTemp: 5,
        minTemp: 0,
        maxTemp: 10,
        avgPrecip: 10,
        daysWithRain: 3,
      },
    ];

    const result = calculateAverageRainfall(weeklyData);
    // Week 1: (35 / 7) * 7 = 35
    // Week 2: (30 / 3) * 7 = 70
    // Total: 105
    expect(result).toBe(105);
  });
});
