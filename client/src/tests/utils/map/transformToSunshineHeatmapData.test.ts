import { describe, it, expect } from 'vitest';
import { transformToSunshineHeatmapData } from '@/utils/map/transformToSunshineHeatmapData';
import { calculateTheoreticalMaxSunshine } from '@/utils/dataFormatting/calculateTheoreticalMaxSunshine';
import type { SunshineData } from '@/types/sunshineDataType';

const expectedPercent = (hours: number, lat: number, month: number) => {
  const max = calculateTheoreticalMaxSunshine(lat, month);
  return max > 0 ? (hours / max) * 100 : 0;
};

describe('transformToSunshineHeatmapData', () => {
  const mockSunshineData: SunshineData[] = [
    {
      cityId: 213,
      city: 'City1',
      country: 'Country1',
      lat: 10,
      long: 20,
      population: 100000,
      stationName: 'Station1',
      jan: 100,
      feb: 120,
      mar: 150,
      apr: 180,
      may: 200,
      jun: 220,
      jul: 240,
      aug: 230,
      sep: 200,
      oct: 170,
      nov: 130,
      dec: 110,
    },
    {
      cityId: 2123,
      city: 'City2',
      country: 'Country2',
      lat: 30,
      long: 40,
      population: 200000,
      stationName: 'Station2',
      jan: 50,
      feb: 60,
      mar: 80,
      apr: 100,
      may: 120,
      jun: 140,
      jul: 150,
      aug: 140,
      sep: 120,
      oct: 90,
      nov: 70,
      dec: 60,
    },
    {
      cityId: 2113,
      city: 'City3',
      country: 'Country3',
      lat: null, // Invalid lat
      long: 60,
      population: 300000,
      stationName: 'Station3',
      jan: 200,
      feb: 210,
      mar: 220,
      apr: 230,
      may: 240,
      jun: 250,
      jul: 260,
      aug: 250,
      sep: 240,
      oct: 230,
      nov: 220,
      dec: 210,
    },
    {
      cityId: 21213,
      city: 'City4',
      country: 'Country4',
      lat: 50,
      long: 60,
      population: 400000,
      stationName: 'Station4',
      jan: null, // Invalid January data
      feb: 150,
      mar: 160,
      apr: 170,
      may: 180,
      jun: 190,
      jul: 200,
      aug: 190,
      sep: 180,
      oct: 170,
      nov: 160,
      dec: 150,
    },
  ];

  it('transforms sunshine data for January as percent of theoretical max', () => {
    const result = transformToSunshineHeatmapData(mockSunshineData, 1);

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      position: [20, 10],
      weight: expectedPercent(100, 10, 1),
    });

    expect(result[1]).toEqual({
      position: [40, 30],
      weight: expectedPercent(50, 30, 1),
    });
  });

  it('transforms sunshine data for June correctly', () => {
    const result = transformToSunshineHeatmapData(mockSunshineData, 6);

    expect(result).toHaveLength(3);

    expect(result[0].weight).toBeCloseTo(expectedPercent(220, 10, 6), 6);
    expect(result[1].weight).toBeCloseTo(expectedPercent(140, 30, 6), 6);
    expect(result[2].weight).toBeCloseTo(expectedPercent(190, 50, 6), 6);
  });

  it('lat-corrects so a high-latitude city does not outscore a lower one with the same hours', () => {
    // Both cities log 200 hours in June; the 60° latitude city has a much
    // longer theoretical day length, so it should produce a *smaller* percent.
    const cities: SunshineData[] = [
      {
        cityId: 1,
        city: 'Low',
        country: 'X',
        lat: 20,
        long: 0,
        population: null,
        jan: null,
        feb: null,
        mar: null,
        apr: null,
        may: null,
        jun: 200,
        jul: null,
        aug: null,
        sep: null,
        oct: null,
        nov: null,
        dec: null,
      },
      {
        cityId: 2,
        city: 'High',
        country: 'X',
        lat: 60,
        long: 0,
        population: null,
        jan: null,
        feb: null,
        mar: null,
        apr: null,
        may: null,
        jun: 200,
        jul: null,
        aug: null,
        sep: null,
        oct: null,
        nov: null,
        dec: null,
      },
    ];

    const result = transformToSunshineHeatmapData(cities, 6);
    const [low, high] = result;
    expect(low.weight).toBeGreaterThan(high.weight);
  });

  it('filters out cities with null coordinates', () => {
    const result = transformToSunshineHeatmapData(mockSunshineData, 12);

    const city3Included = result.some(
      (item) => item.position[0] === 60 && item.position[1] === null
    );

    expect(city3Included).toBe(false);
  });

  it('filters out cities with null sunshine data for the selected month', () => {
    const result = transformToSunshineHeatmapData(mockSunshineData, 1);

    const city4Included = result.some(
      (item) => item.position[0] === 60 && item.position[1] === 50
    );

    expect(city4Included).toBe(false);
  });

  it('returns empty array for invalid month', () => {
    const result = transformToSunshineHeatmapData(mockSunshineData, 13);
    expect(result).toEqual([]);
  });
});
