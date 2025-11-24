import { objectType, queryField, nonNull, stringArg, intArg, floatArg, list } from 'nexus';
import type { City } from '@prisma/client';
import { getCachedWeatherData } from '../utils/cache';
import queryCityIds from '../utils/weatherQueries';
import calculateDistance from '../utils/calculateDistance';
import {
  mapWeatherRecord,
  mapWeatherRecords,
  type WeatherRecordWithRelations,
} from '../utils/weatherDataMappers';
import {
  findCityByNameAndCoords,
  formatMonthDayToDate,
  titleCaseCityName,
} from '../utils/cityHelpers';

// GraphQL WeatherData type definition
export const WeatherData = objectType({
  name: 'WeatherData',
  description: 'Weather data for a specific location and date',
  definition(t) {
    t.nonNull.string('city', { description: 'City name' });
    t.string('country', { description: 'Country name' });
    t.string('state', { description: 'State or region' });
    t.string('suburb', { description: 'Suburb or district' });
    t.nonNull.string('date', { description: 'Date in YYYY-MM-DD format' });
    t.float('lat', { description: 'Latitude coordinate' });
    t.float('long', { description: 'Longitude coordinate' });
    t.float('population', { description: 'City population' });
    t.float('precipitation', { description: 'Precipitation in mm' });
    t.float('snowDepth', { description: 'Snow depth in mm' });
    t.float('avgTemperature', { description: 'Average temperature in °C' });
    t.float('maxTemperature', { description: 'Maximum temperature in °C' });
    t.float('minTemperature', { description: 'Minimum temperature in °C' });
    t.nonNull.string('stationName', { description: 'Weather station name' });
  },
});

// Query: Get all weather data (paginated)
export const weatherDataQuery = queryField('weatherData', {
  type: list('WeatherData'),
  description: 'Get all weather data with pagination',
  args: {
    limit: intArg({ default: 10, description: 'Number of records to return' }),
    offset: intArg({ default: 0, description: 'Number of records to skip' }),
  },
  async resolve(_parent, args, context) {
    const records = await context.prisma.weatherRecord.findMany({
      take: args.limit || 10,
      skip: args.offset || 0,
      include: {
        city: true,
        station: true,
      },
    });

    return mapWeatherRecords(records);
  },
});

// Query: Get weather by date (MMDD format)
export const weatherByDateQuery = queryField('weatherByDate', {
  type: list('WeatherData'),
  description: 'Get weather data for a specific date (MMDD format, e.g., "0315" for March 15)',
  args: {
    monthDay: nonNull(stringArg({ description: 'Date in MMDD format (e.g., "0315")' })),
  },
  async resolve(_parent, args, context) {
    const dateStr = formatMonthDayToDate(args.monthDay);

    // use caching to avoid repeated queries for the same date
    const cacheKey = `weather:${dateStr}`;

    return getCachedWeatherData(cacheKey, async () => {
      const startTime = Date.now();

      // use shared query logic for smart city distribution
      const selectedCityIds = await queryCityIds({
        prisma: context.prisma,
        dateStr,
      });

      // fetch weather records for selected cities
      const records = await context.prisma.weatherRecord.findMany({
        where: {
          date: dateStr,
          cityId: { in: selectedCityIds },
        },
        include: {
          city: true,
          station: true,
        },
      });

      // calculate distribution statistics for logging
      const countryDistribution = records.reduce(
        (acc: Record<string, number>, record: WeatherRecordWithRelations) => {
          const { country } = record.city;
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const queryTime = Date.now() - startTime;
      const countriesCount = Object.keys(countryDistribution).length;
      const maxCitiesPerCountry = Math.max(...(Object.values(countryDistribution) as number[]));
      const avgCitiesPerCountry = (records.length / countriesCount).toFixed(1);

      console.log(`\n📊 Weather query for ${dateStr}:`);
      console.log(`  ⏱️  Query time: ${queryTime}ms`);
      console.log(`  🌍 Countries: ${countriesCount}`);
      console.log(`  🏙️  Total cities: ${records.length}`);
      console.log(`  📈 Max per country: ${maxCitiesPerCountry}`);
      console.log(`  📊 Avg per country: ${avgCitiesPerCountry}`);

      // log top 5 countries by city count
      const topCountries = Object.entries(countryDistribution)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5);
      console.log(`  🔝 Top countries: ${topCountries.map(([c, n]) => `${c}(${n})`).join(', ')}`);

      return records.map((record: WeatherRecordWithRelations) => ({
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
      }));
    });
  },
});

// Query: Get weather by date and geographic bounds
export const weatherByDateAndBoundsQuery = queryField('weatherByDateAndBounds', {
  type: list('WeatherData'),
  description: 'Get weather data for a specific date within geographic bounds (for zoomed views)',
  args: {
    monthDay: nonNull(stringArg({ description: 'Date in MMDD format (e.g., "0315")' })),
    minLat: nonNull(floatArg({ description: 'Minimum latitude' })),
    maxLat: nonNull(floatArg({ description: 'Maximum latitude' })),
    minLong: nonNull(floatArg({ description: 'Minimum longitude' })),
    maxLong: nonNull(floatArg({ description: 'Maximum longitude' })),
  },
  async resolve(_parent, args, context) {
    // convert MMDD to 2020-MM-DD format
    const month = args.monthDay.slice(0, 2);
    const day = args.monthDay.slice(2);
    const dateStr = `2020-${month}-${day}`;

    // create cache key including bounds
    const cacheKey = `weather:${dateStr}:bounds:${args.minLat}-${args.maxLat}:${args.minLong}-${args.maxLong}`;

    return getCachedWeatherData(cacheKey, async () => {
      const startTime = Date.now();

      // use shared query logic with bounds filtering
      const selectedCityIds = await queryCityIds({
        prisma: context.prisma,
        dateStr,
        bounds: {
          minLat: args.minLat,
          maxLat: args.maxLat,
          minLong: args.minLong,
          maxLong: args.maxLong,
        },
      });

      // fetch weather records for selected cities
      const records = await context.prisma.weatherRecord.findMany({
        where: {
          date: dateStr,
          cityId: { in: selectedCityIds },
        },
        include: {
          city: true,
          station: true,
        },
      });

      // calculate distribution statistics for logging
      const countryDistribution = records.reduce(
        (acc: Record<string, number>, record: WeatherRecordWithRelations) => {
          const { country } = record.city;
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const queryTime = Date.now() - startTime;
      const countriesCount = Object.keys(countryDistribution).length;
      const maxCitiesPerCountry = Math.max(...(Object.values(countryDistribution) as number[]));
      const avgCitiesPerCountry = (records.length / countriesCount).toFixed(1);

      console.log(`\n📊 Weather query (BOUNDS) for ${dateStr}:`);
      console.log(
        `  📍 Bounds: lat[${args.minLat}, ${args.maxLat}], long[${args.minLong}, ${args.maxLong}]`
      );
      console.log(`  ⏱️  Query time: ${queryTime}ms`);
      console.log(`  🌍 Countries: ${countriesCount}`);
      console.log(`  🏙️  Total cities: ${records.length}`);
      console.log(`  📈 Max per country: ${maxCitiesPerCountry}`);
      console.log(`  📊 Avg per country: ${avgCitiesPerCountry}`);

      // log top 5 countries by city count
      const topCountries = Object.entries(countryDistribution)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5);
      console.log(`  🔝 Top countries: ${topCountries.map(([c, n]) => `${c}(${n})`).join(', ')}`);

      return records.map((record: WeatherRecordWithRelations) => ({
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
      }));
    });
  },
});

// Query: Get weather by city
export const weatherByCityQuery = queryField('weatherByCity', {
  type: list('WeatherData'),
  description: 'Get weather data for a specific city',
  args: {
    city: nonNull(stringArg({ description: 'City name (case-insensitive)' })),
  },
  async resolve(_parent, args, context) {
    const cityName = titleCaseCityName(args.city);

    const cities = await context.prisma.city.findMany({
      where: { name: cityName },
    });

    if (cities.length === 0) {
      return [];
    }

    // get weather records for all matching cities
    const cityIds = cities.map((c: City) => c.id);
    const records = await context.prisma.weatherRecord.findMany({
      where: {
        cityId: { in: cityIds },
      },
      take: 100,
      include: {
        city: true,
        station: true,
      },
    });

    return mapWeatherRecords(records);
  },
});

// Query: Get weather data for a specific city and date
export const weatherByCityAndDateQuery = queryField('weatherByCityAndDate', {
  type: 'WeatherData',
  description: 'Get weather data for a specific city on a specific date',
  args: {
    city: nonNull(stringArg({ description: 'City name (case-insensitive)' })),
    lat: floatArg({ description: 'City latitude for precise matching' }),
    long: floatArg({ description: 'City longitude for precise matching' }),
    monthDay: nonNull(stringArg({ description: 'Date in MMDD format (e.g., "0315")' })),
  },
  async resolve(_parent, args, context) {
    const dateStr = formatMonthDayToDate(args.monthDay);
    const city = await findCityByNameAndCoords(context.prisma, args.city, args.lat, args.long);

    if (!city) {
      return null;
    }

    const record = await context.prisma.weatherRecord.findFirst({
      where: {
        cityId: city.id,
        date: dateStr,
      },
      include: {
        city: true,
        station: true,
      },
    });

    return record ? mapWeatherRecord(record) : null;
  },
});

// Query: Get all unique cities
export const citiesQuery = queryField('cities', {
  type: list('String'),
  description: 'Get list of all unique cities in the database',
  async resolve(_parent, _args, context) {
    const cities = await context.prisma.city.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    return cities.map((c: { name: string }) => c.name);
  },
});

// Query: Get all unique countries
export const countriesQuery = queryField('countries', {
  type: list('String'),
  description: 'Get list of all unique countries in the database',
  async resolve(_parent, _args, context) {
    const countries = await context.prisma.city.findMany({
      distinct: ['country'],
      select: { country: true },
      orderBy: { country: 'asc' },
    });

    return countries.map((c: { country: string }) => c.country);
  },
});

// GraphQL CityResult type definition
export const CityResult = objectType({
  name: 'CityResult',
  description: 'City information with optional distance',
  definition(t) {
    t.nonNull.int('id', { description: 'City ID' });
    t.nonNull.string('name', { description: 'City name' });
    t.nonNull.string('country', { description: 'Country name' });
    t.string('state', { description: 'State or region' });
    t.nonNull.float('lat', { description: 'Latitude coordinate' });
    t.nonNull.float('long', { description: 'Longitude coordinate' });
    t.float('population', { description: 'City population' });
    t.float('distance', { description: 'Distance in kilometers (for nearest city queries)' });
  },
});

// Query: Find nearest city to given coordinates
export const nearestCityQuery = queryField('nearestCity', {
  type: 'CityResult',
  description: 'Find the nearest city to given coordinates',
  args: {
    lat: nonNull(floatArg({ description: 'Latitude' })),
    long: nonNull(floatArg({ description: 'Longitude' })),
  },
  async resolve(_parent, args, context) {
    // get all cities
    const cities = await context.prisma.city.findMany();

    // calculate distances and find nearest
    let nearestCity: City | null = null;
    let minDistance = Infinity;

    for (const city of cities) {
      const distance = calculateDistance(args.lat, args.long, city.lat, city.long);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    if (!nearestCity) {
      return null;
    }

    return {
      id: nearestCity.id,
      name: nearestCity.name,
      country: nearestCity.country,
      state: nearestCity.state,
      lat: nearestCity.lat,
      long: nearestCity.long,
      population: nearestCity.population,
      distance: minDistance,
    };
  },
});

// Query: Search cities by name
export const searchCitiesQuery = queryField('searchCities', {
  type: list('CityResult'),
  description: 'Search cities by name (case-insensitive, partial match)',
  args: {
    searchTerm: nonNull(stringArg({ description: 'Search term' })),
    limit: intArg({ default: 10, description: 'Maximum number of results' }),
  },
  async resolve(_parent, args, context) {
    const cities = await context.prisma.city.findMany({
      where: {
        name: {
          contains: args.searchTerm,
          mode: 'insensitive',
        },
      },
      orderBy: [{ population: 'desc' }, { name: 'asc' }],
      take: args.limit || 10,
    });

    return cities.map((city: City) => ({
      id: city.id,
      name: city.name,
      country: city.country,
      state: city.state,
      lat: city.lat,
      long: city.long,
      population: city.population,
      distance: null,
    }));
  },
});
