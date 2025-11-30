import { describe, it, expect } from 'vitest';
import { transformToSunshineHeatmapData } from '@/utils/map/transformToSunshineHeatmapData';
import type { SunshineData } from '@/types/sunshineDataType';

describe('transformToSunshineHeatmapData', () => {
  const mockSunshineData: SunshineData[] = [
    {
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

  it('transforms sunshine data for January correctly', () => {
    const result = transformToSunshineHeatmapData(mockSunshineData, 1);

    // Should only include cities with valid lat/long and January data
    expect(result).toHaveLength(2);

    // Check first city
    expect(result[0]).toEqual({
      position: [20, 10], // [long, lat]
      weight: 100, // January sunshine hours
    });

    // Check second city
    expect(result[1]).toEqual({
      position: [40, 30],
      weight: 50,
    });
  });

  it('transforms sunshine data for June correctly', () => {
    const result = transformToSunshineHeatmapData(mockSunshineData, 6);

    // Should include 3 cities (all except City3 which has null lat)
    expect(result).toHaveLength(3);

    // Check values for June
    expect(result[0].weight).toBe(220); // City1 June
    expect(result[1].weight).toBe(140); // City2 June
    expect(result[2].weight).toBe(190); // City4 June
  });

  it('filters out cities with null coordinates', () => {
    const result = transformToSunshineHeatmapData(mockSunshineData, 12);

    // Should not include City3 (null lat)
    const city3Included = result.some(
      (item) => item.position[0] === 60 && item.position[1] === null
    );

    expect(city3Included).toBe(false);
  });

  it('filters out cities with null sunshine data for the selected month', () => {
    const result = transformToSunshineHeatmapData(mockSunshineData, 1);

    // Should not include City4 (null January data)
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
