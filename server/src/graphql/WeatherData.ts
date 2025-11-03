import { objectType, queryField, nonNull, stringArg, intArg, list } from 'nexus';
import type { City, WeatherStation, WeatherRecord } from '@prisma/client';
import { MAX_CITIES_GLOBAL_VIEW, QUOTA_THRESHOLDS } from '../const';
import { getCachedWeatherData } from '../utils/cache';

type WeatherRecordWithRelations = WeatherRecord & {
  city: City;
  station: WeatherStation;
};

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
    // convert MMDD to 2020-MM-DD format (matching Python API logic)
    const month = args.monthDay.slice(0, 2);
    const day = args.monthDay.slice(2);
    const dateStr = `2020-${month}-${day}`;

    // use caching to avoid repeated queries for the same date
    const cacheKey = `weather:${dateStr}`;

    return getCachedWeatherData(cacheKey, async () => {
      const startTime = Date.now();

      // single-query approach using window functions for fair distribution
      // this query:
      // 1. ranks cities within each country by population
      // 2. calculates adaptive quotas based on total country count
      // 3. applies quotas and returns final result set
      // all in one database round-trip (~300ms)
      const cityIds = await context.prisma.$queryRaw<Array<{ id: number }>>`
        WITH ranked_cities AS (
          -- rank cities within each country by population
          SELECT 
            c.id,
            c.country,
            c.population,
            ROW_NUMBER() OVER (
              PARTITION BY c.country 
              ORDER BY c.population DESC NULLS LAST
            ) as country_rank
          FROM cities c
          INNER JOIN weather_records wr ON wr."cityId" = c.id
          WHERE wr.date = ${dateStr}
        ),
        country_stats AS (
          -- calculate how many countries we have
          SELECT COUNT(DISTINCT country) as total_countries
          FROM ranked_cities
        ),
        quota_calc AS (
          -- calculate per-country quota based on total countries
          SELECT 
            CASE 
              WHEN total_countries > ${QUOTA_THRESHOLDS.MANY_COUNTRIES} THEN ${QUOTA_THRESHOLDS.MAX_PER_COUNTRY_MANY}
              WHEN total_countries > ${QUOTA_THRESHOLDS.MODERATE_COUNTRIES} THEN ${QUOTA_THRESHOLDS.MAX_PER_COUNTRY_MODERATE}
              ELSE ${QUOTA_THRESHOLDS.MAX_PER_COUNTRY_FEW}
            END as max_per_country
          FROM country_stats
        )
        SELECT rc.id
        FROM ranked_cities rc
        CROSS JOIN quota_calc qc
        WHERE rc.country_rank <= qc.max_per_country
        ORDER BY 
          rc.country_rank,  -- prioritize country representatives (rank 1)
          rc.population DESC NULLS LAST
        LIMIT ${MAX_CITIES_GLOBAL_VIEW}
      `;

      const selectedCityIds = cityIds.map((c: { id: number }) => c.id);

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
          const country = record.city.country;
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
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

// Query: Get weather by city
export const weatherByCityQuery = queryField('weatherByCity', {
  type: list('WeatherData'),
  description: 'Get weather data for a specific city',
  args: {
    city: nonNull(stringArg({ description: 'City name (case-insensitive)' })),
  },
  async resolve(_parent, args, context) {
    // title case the city name (matching Python API logic)
    const cityName = args.city.charAt(0).toUpperCase() + args.city.slice(1).toLowerCase();

    // find the city first
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
