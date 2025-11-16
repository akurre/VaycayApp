import { objectType, queryField, nonNull, intArg, list } from 'nexus';
import type { City, MonthlySunshine } from '@prisma/client';
import { MAX_CITIES_GLOBAL_VIEW } from '../const';
import { getCachedWeatherData } from '../utils/cache';

// helper type combining monthly sunshine with related city data
type MonthlySunshineWithRelations = MonthlySunshine & {
  city: City;
};

// ordered list of monthly field names used for dynamic column selection
const MONTH_FIELDS: Array<keyof MonthlySunshine> = [ // todo put in const
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

// graphql type for monthly sunshine data
export const SunshineData = objectType({
  name: 'SunshineData',
  description: 'monthly sunshine hours for a specific location',
  definition(t) {
    t.nonNull.string('city', { description: 'city name' });
    t.string('country', { description: 'country name' });
    t.string('state', { description: 'state or region' });
    t.string('suburb', { description: 'suburb or district' });
    t.float('lat', { description: 'latitude coordinate' });
    t.float('long', { description: 'longitude coordinate' });
    t.float('population', { description: 'city population' });

    // monthly sunshine hours (in hours)
    t.float('jan', { description: 'january sunshine hours' });
    t.float('feb', { description: 'february sunshine hours' });
    t.float('mar', { description: 'march sunshine hours' });
    t.float('apr', { description: 'april sunshine hours' });
    t.float('may', { description: 'may sunshine hours' });
    t.float('jun', { description: 'june sunshine hours' });
    t.float('jul', { description: 'july sunshine hours' });
    t.float('aug', { description: 'august sunshine hours' });
    t.float('sep', { description: 'september sunshine hours' });
    t.float('oct', { description: 'october sunshine hours' });
    t.float('nov', { description: 'november sunshine hours' });
    t.float('dec', { description: 'december sunshine hours' });

    // for future use if we ever attach station metadata to sunshine data
    t.string('stationName', { description: 'source station name, if available' });
  },
});

// query: get sunshine data for a specific month (1-12) across all cities
export const sunshineByMonthQuery = queryField('sunshineByMonth', {
  type: list('SunshineData'),
  description: 'get monthly sunshine data for a given month (1-12) across all cities',
  args: {
    month: nonNull(intArg({ description: 'month number (1-12)' })),
  },
  async resolve(_parent, args, context) {
    const monthIndex = args.month - 1;
    const monthField = MONTH_FIELDS[monthIndex];

    if (!monthField) {
      console.warn(`sunshineByMonth: invalid month ${args.month}`);
      return [];
    }

    const cacheKey = `sunshine:month:${args.month}`;

    return getCachedWeatherData(cacheKey, async () => {
      const startTime = Date.now();

      const records = await context.prisma.monthlySunshine.findMany({
        where: {
          // ensure we only return cities with sunshine data for the requested month
          [monthField]: {
            not: null,
          },
        } as Record<string, unknown>,
        include: {
          city: true,
        },
        take: MAX_CITIES_GLOBAL_VIEW,
        orderBy: {
          city: {
            population: 'desc',
          },
        },
      });

      const countryDistribution = records.reduce(
        (acc: Record<string, number>, record: MonthlySunshineWithRelations) => {
          const { country } = record.city;
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const queryTime = Date.now() - startTime;
      const countriesCount = Object.keys(countryDistribution).length;
      const maxCitiesPerCountry =
        countriesCount > 0 ? Math.max(...(Object.values(countryDistribution) as number[])) : 0;
      const avgCitiesPerCountry =
        countriesCount > 0 ? (records.length / countriesCount).toFixed(1) : '0.0';

      console.log(`\n📊 Sunshine query for month ${args.month}:`);
      console.log(`  ⏱️  Query time: ${queryTime}ms`);
      console.log(`  🌍 Countries: ${countriesCount}`);
      console.log(`  🏙️  Total cities: ${records.length}`);
      console.log(`  📈 Max per country: ${maxCitiesPerCountry}`);
      console.log(`  📊 Avg per country: ${avgCitiesPerCountry}`);

      const topCountries = Object.entries(countryDistribution)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5);
      console.log(`  🔝 Top countries: ${topCountries.map(([c, n]) => `${c}(${n})`).join(', ')}`);

      return records.map((record: MonthlySunshineWithRelations) => ({
        city: record.city.name,
        country: record.city.country,
        state: record.city.state,
        suburb: record.city.suburb,
        lat: record.city.lat,
        long: record.city.long,
        population: record.city.population,
        jan: record.jan,
        feb: record.feb,
        mar: record.mar,
        apr: record.apr,
        may: record.may,
        jun: record.jun,
        jul: record.jul,
        aug: record.aug,
        sep: record.sep,
        oct: record.oct,
        nov: record.nov,
        dec: record.dec,
        // no station information for sunshine data yet
        stationName: null,
      }));
    });
  },
});

// query: get sunshine data for a specific month within geographic bounds
export const sunshineByMonthAndBoundsQuery = queryField('sunshineByMonthAndBounds', {
  type: list('SunshineData'),
  description:
    'get monthly sunshine data for a given month (1-12) within geographic bounds (for zoomed views)',
  args: {
    month: nonNull(intArg({ description: 'month number (1-12)' })),
    minLat: nonNull(intArg({ description: 'minimum latitude' })),
    maxLat: nonNull(intArg({ description: 'maximum latitude' })),
    minLong: nonNull(intArg({ description: 'minimum longitude' })),
    maxLong: nonNull(intArg({ description: 'maximum longitude' })),
  },
  async resolve(_parent, args, context) {
    const monthIndex = args.month - 1;
    const monthField = MONTH_FIELDS[monthIndex];

    if (!monthField) {
      console.warn(`sunshineByMonthAndBounds: invalid month ${args.month}`);
      return [];
    }

    const cacheKey = `sunshine:month:${args.month}:bounds:${args.minLat}-${args.maxLat}:${args.minLong}-${args.maxLong}`;

    return getCachedWeatherData(cacheKey, async () => {
      const startTime = Date.now();

      const records = await context.prisma.monthlySunshine.findMany({
        where: {
          [monthField]: {
            not: null,
          },
          city: {
            lat: {
              gte: args.minLat,
              lte: args.maxLat,
            },
            long: {
              gte: args.minLong,
              lte: args.maxLong,
            },
          },
        } as Record<string, unknown>,
        include: {
          city: true,
        },
        take: MAX_CITIES_GLOBAL_VIEW,
        orderBy: {
          city: {
            population: 'desc',
          },
        },
      });

      const countryDistribution = records.reduce(
        (acc: Record<string, number>, record: MonthlySunshineWithRelations) => {
          const { country } = record.city;
          acc[country] = (acc[country] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const queryTime = Date.now() - startTime;
      const countriesCount = Object.keys(countryDistribution).length;
      const maxCitiesPerCountry =
        countriesCount > 0 ? Math.max(...(Object.values(countryDistribution) as number[])) : 0;
      const avgCitiesPerCountry =
        countriesCount > 0 ? (records.length / countriesCount).toFixed(1) : '0.0';

      console.log(`\n📊 Sunshine query (BOUNDS) for month ${args.month}:`);
      console.log(
        `  📍 Bounds: lat[${args.minLat}, ${args.maxLat}], long[${args.minLong}, ${args.maxLong}]`
      );
      console.log(`  ⏱️  Query time: ${queryTime}ms`);
      console.log(`  🌍 Countries: ${countriesCount}`);
      console.log(`  🏙️  Total cities: ${records.length}`);
      console.log(`  📈 Max per country: ${maxCitiesPerCountry}`);
      console.log(`  📊 Avg per country: ${avgCitiesPerCountry}`);

      const topCountries = Object.entries(countryDistribution)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5);
      console.log(`  🔝 Top countries: ${topCountries.map(([c, n]) => `${c}(${n})`).join(', ')}`);

      return records.map((record: MonthlySunshineWithRelations) => ({
        city: record.city.name,
        country: record.city.country,
        state: record.city.state,
        suburb: record.city.suburb,
        lat: record.city.lat,
        long: record.city.long,
        population: record.city.population,
        jan: record.jan,
        feb: record.feb,
        mar: record.mar,
        apr: record.apr,
        may: record.may,
        jun: record.jun,
        jul: record.jul,
        aug: record.aug,
        sep: record.sep,
        oct: record.oct,
        nov: record.nov,
        dec: record.dec,
        stationName: null,
      }));
    });
  },
});
