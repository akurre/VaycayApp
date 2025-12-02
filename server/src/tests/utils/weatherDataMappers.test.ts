import { describe, it, expect } from 'vitest';
import { mapWeatherRecord, mapWeatherRecords } from '../../utils/weatherDataMappers';
import { createMockWeatherRecordWithRelations } from '../test-utils';

describe('weatherDataMappers', () => {
  describe('mapWeatherRecord', () => {
    it('maps a weather record with all fields correctly', () => {
      const mockRecord = createMockWeatherRecordWithRelations();

      const result = mapWeatherRecord(mockRecord);

      expect(result).toEqual({
        cityId: 123,
        city: 'Berlin',
        country: 'Germany',
        state: 'Berlin',
        suburb: null,
        date: '2020-01-15',
        lat: 52.5167,
        long: 13.3833,
        population: 3644826,
        precipitation: 5.2,
        snowDepth: 10.5,
        avgTemperature: 15.3,
        maxTemperature: 20.1,
        minTemperature: 10.5,
        stationName: 'Berlin Weather Station',
      });
    });

    it('includes cityId field (non-nullable in GraphQL schema)', () => {
      const mockRecord = createMockWeatherRecordWithRelations({
        city: { id: 999, name: 'Test City', country: 'Test Country' },
        record: {
          PRCP: null,
          SNWD: null,
          TAVG: null,
          TMAX: null,
          TMIN: null,
        },
      });

      const result = mapWeatherRecord(mockRecord);

      // cityId must be present and match the city.id
      expect(result.cityId).toBe(999);
      expect(result.cityId).toBe(mockRecord.city.id);
    });

    it('handles null weather values correctly', () => {
      const mockRecord = createMockWeatherRecordWithRelations({
        record: {
          PRCP: null,
          SNWD: null,
          TAVG: null,
          TMAX: null,
          TMIN: null,
        },
      });

      const result = mapWeatherRecord(mockRecord);

      expect(result.precipitation).toBeNull();
      expect(result.snowDepth).toBeNull();
      expect(result.avgTemperature).toBeNull();
      expect(result.maxTemperature).toBeNull();
      expect(result.minTemperature).toBeNull();
    });
  });

  describe('mapWeatherRecords', () => {
    it('maps multiple weather records correctly', () => {
      const mockRecords = [
        createMockWeatherRecordWithRelations(),
        createMockWeatherRecordWithRelations({
          city: {
            id: 789,
            name: 'Paris',
            country: 'France',
            state: 'Île-de-France',
            lat: 48.8566,
            long: 2.3522,
            population: 2165423,
          },
          station: {
            id: 101,
            name: 'Paris Weather Station',
          },
          record: {
            id: 2,
            PRCP: 2.1,
            SNWD: null,
            TAVG: 8.5,
            TMAX: 12.0,
            TMIN: 5.0,
          },
        }),
      ];

      const results = mapWeatherRecords(mockRecords);

      expect(results).toHaveLength(2);
      expect(results[0].cityId).toBe(123);
      expect(results[0].city).toBe('Berlin');
      expect(results[1].cityId).toBe(789);
      expect(results[1].city).toBe('Paris');
    });

    it('returns empty array for empty input', () => {
      const results = mapWeatherRecords([]);
      expect(results).toEqual([]);
    });
  });
});
