import type { City, WeatherStation, WeatherRecord } from '@prisma/client';
import type { WeatherRecordWithRelations } from '../utils/weatherDataMappers';

/**
 * creates a mock city object for testing
 */
export function createMockCity(overrides?: Partial<City>): City {
  return {
    id: 123,
    name: 'Berlin',
    country: 'Germany',
    state: 'Berlin',
    suburb: null,
    lat: 52.5167,
    long: 13.3833,
    cityAscii: 'Berlin',
    iso2: 'DE',
    iso3: 'DEU',
    capital: 'primary',
    worldcitiesId: 1276451,
    population: 3644826,
    dataSource: 'worldcities',
    ...overrides,
  };
}

/**
 * creates a mock weather station object for testing
 */
export function createMockStation(overrides?: Partial<WeatherStation>): WeatherStation {
  return {
    id: 456,
    name: 'Berlin Weather Station',
    cityId: 123,
    ...overrides,
  };
}

/**
 * creates a mock weather record object for testing
 */
export function createMockWeatherRecord(
  overrides?: Partial<WeatherRecord>
): WeatherRecord {
  return {
    id: 1,
    cityId: 123,
    stationId: 456,
    date: '2020-01-15',
    PRCP: 5.2,
    SNWD: 10.5,
    TAVG: 15.3,
    TMAX: 20.1,
    TMIN: 10.5,
    AWND: null,
    DAPR: null,
    DATN: null,
    DATX: null,
    DWPR: null,
    MDPR: null,
    MDTN: null,
    MDTX: null,
    WDF2: null,
    WDF5: null,
    WSF2: null,
    WSF5: null,
    ...overrides,
  };
}

/**
 * creates a complete mock weather record with relations for testing
 */
export function createMockWeatherRecordWithRelations(
  overrides?: {
    record?: Partial<WeatherRecord>;
    city?: Partial<City>;
    station?: Partial<WeatherStation>;
  }
): WeatherRecordWithRelations {
  const city = createMockCity(overrides?.city);
  const station = createMockStation({ cityId: city.id, ...overrides?.station });
  const record = createMockWeatherRecord({
    cityId: city.id,
    stationId: station.id,
    ...overrides?.record,
  });

  return {
    ...record,
    city,
    station,
  };
}
