import type { City, WeatherStation, WeatherRecord } from '@prisma/client';

export type WeatherRecordWithRelations = WeatherRecord & {
  city: City;
  station: WeatherStation;
};

/**
 * Maps a weather record with relations to the GraphQL WeatherData format
 */
export function mapWeatherRecord(record: WeatherRecordWithRelations) {
  return {
    city: record.city.name,
    country: record.city.country,
    state: record.city.state,
    suburb: record.city.suburb,
    date: record.date,
    lat: record.city.lat,
    long: record.city.long,
    population: record.city.population,
    precipitation: record.PRCP,
    snowDepth: record.SNWD,
    avgTemperature: record.TAVG,
    maxTemperature: record.TMAX,
    minTemperature: record.TMIN,
    stationName: record.station.name,
  };
}

/**
 * Maps multiple weather records to GraphQL WeatherData format
 */
export function mapWeatherRecords(records: WeatherRecordWithRelations[]) {
  return records.map(mapWeatherRecord);
}
