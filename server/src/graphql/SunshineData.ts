import { objectType, queryField, nonNull, intArg, list, stringArg, floatArg } from 'nexus';
import type { City, MonthlySunshine, PrismaClient } from '@prisma/client';
import { MONTH_FIELDS } from '../const';
import { getCachedWeatherData } from '../utils/cache';
import querySunshineCityIds from '../utils/sunshineQueries';
import quantizeBoundsForCacheKey from '../utils/quantizeBoundsForCacheKey';
import type { Bounds } from '../types/boundsTypes';
import { titleCaseCityName, findClosestCity } from '../utils/cityHelpers';

// helper type combining monthly sunshine with related city data
type MonthlySunshineWithRelations = MonthlySunshine & {
  city: City;
};

// graphql type for monthly sunshine data
export const SunshineData = objectType({
  name: 'SunshineData',
  description: 'monthly sunshine hours for a specific location',
  definition(t) {
    t.nonNull.int('cityId', { description: 'unique city identifier' });
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

// Helper function to map sunshine records to GraphQL response format
function mapSunshineRecords(records: MonthlySunshineWithRelations[]) {
  return records.map((record) => ({
    cityId: record.city.id,
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
}

// Helper function to log query statistics
function logQueryStats(
  month: number,
  records: MonthlySunshineWithRelations[],
  queryTime: number,
  bounds?: Bounds
) {
  const countryDistribution = records.reduce(
    (acc: Record<string, number>, record) => {
      const { country } = record.city;
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const countriesCount = Object.keys(countryDistribution).length;
  const maxCitiesPerCountry =
    countriesCount > 0 ? Math.max(...(Object.values(countryDistribution) as number[])) : 0;
  const avgCitiesPerCountry =
    countriesCount > 0 ? (records.length / countriesCount).toFixed(1) : '0.0';

  console.log(`\n📊 Sunshine query${bounds ? ' (BOUNDS)' : ''} for month ${month}:`);
  if (bounds) {
    console.log(
      `  📍 Quantized bounds (SQL + cache key): lat[${bounds.minLat}, ${bounds.maxLat}], long[${bounds.minLong}, ${bounds.maxLong}]`
    );
  }
  console.log(`  ⏱️  Query time: ${queryTime}ms`);
  console.log(`  🌍 Countries: ${countriesCount}`);
  console.log(`  🏙️  Total cities: ${records.length}`);
  console.log(`  📈 Max per country: ${maxCitiesPerCountry}`);
  console.log(`  📊 Avg per country: ${avgCitiesPerCountry}`);

  const topCountries = Object.entries(countryDistribution)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5);
  console.log(`  🔝 Top countries: ${topCountries.map(([c, n]) => `${c}(${n})`).join(', ')}`);
}

// Shared function to fetch sunshine data by month with optional bounds
async function fetchSunshineByMonth(prisma: PrismaClient, month: number, bounds?: Bounds) {
  const monthIndex = month - 1;
  const monthField = MONTH_FIELDS[monthIndex];

  if (!monthField) {
    console.warn(`fetchSunshineByMonth: invalid month ${month}`);
    return [];
  }

  const startTime = Date.now();

  // use grid-based city selection for better spatial distribution
  const selectedCityIds = await querySunshineCityIds({
    prisma,
    month,
    bounds,
  });

  // fetch sunshine records for selected cities
  const records = await prisma.monthlySunshine.findMany({
    where: {
      cityId: { in: selectedCityIds },
      [monthField]: { not: null },
    },
    include: { city: true },
  });

  const queryTime = Date.now() - startTime;
  logQueryStats(month, records, queryTime, bounds);

  return mapSunshineRecords(records);
}

// query: get sunshine data for a specific month (1-12) across all cities
export const sunshineByMonthQuery = queryField('sunshineByMonth', {
  type: list('SunshineData'),
  description: 'get monthly sunshine data for a given month (1-12) across all cities',
  args: {
    month: nonNull(intArg({ description: 'month number (1-12)' })),
  },
  async resolve(_parent, args, context) {
    const cacheKey = `sunshine:month:${args.month}`;
    return getCachedWeatherData(cacheKey, async () => {
      return fetchSunshineByMonth(context.prisma, args.month);
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
    minLat: nonNull(floatArg({ description: 'minimum latitude' })),
    maxLat: nonNull(floatArg({ description: 'maximum latitude' })),
    minLong: nonNull(floatArg({ description: 'minimum longitude' })),
    maxLong: nonNull(floatArg({ description: 'maximum longitude' })),
  },
  async resolve(_parent, args, context) {
    // Quantize bounds once; same object drives the cache key AND SQL inputs
    // so views in the same bucket return identical city sets (no churn).
    const cacheBounds = quantizeBoundsForCacheKey({
      minLat: args.minLat,
      maxLat: args.maxLat,
      minLong: args.minLong,
      maxLong: args.maxLong,
    });
    const cacheKey = `sunshine:month:${args.month}:bounds:${cacheBounds.minLat}-${cacheBounds.maxLat}:${cacheBounds.minLong}-${cacheBounds.maxLong}`;

    return getCachedWeatherData(cacheKey, async () => {
      console.log(
        `\n📍 Sunshine raw bounds (request): lat[${args.minLat}, ${args.maxLat}], long[${args.minLong}, ${args.maxLong}]`
      );
      // SQL gets quantized bounds so cache hits + fresh misses in the same
      // quantum return identical city sets. Edge clip is bounded to step/2.
      return fetchSunshineByMonth(context.prisma, args.month, cacheBounds);
    });
  },
});

// Query: Get sunshine data for a specific city
export const sunshineByCityQuery = queryField('sunshineByCity', {
  type: 'SunshineData',
  description: 'Get sunshine data for a specific city',
  args: {
    city: nonNull(stringArg({ description: 'City name (case-insensitive)' })),
    lat: floatArg({ description: 'City latitude for precise matching' }),
    long: floatArg({ description: 'City longitude for precise matching' }),
  },
  async resolve(_parent, args, context) {
    // title case the city name using shared helper
    const cityName = titleCaseCityName(args.city);

    // find the city - use coordinates for precise matching if provided
    if (
      args.lat !== null &&
      args.lat !== undefined &&
      args.long !== null &&
      args.long !== undefined
    ) {
      // if coordinates provided, use them for precise matching
      const cities = await context.prisma.city.findMany({
        where: {
          name: cityName,
        },
      });

      // find the city with closest coordinates using shared helper
      const closestCity = findClosestCity(cities, args.lat, args.long);

      if (!closestCity) {
        return null;
      }

      // get sunshine record for this specific city
      const record = await context.prisma.monthlySunshine.findFirst({
        where: {
          cityId: closestCity.id,
        },
        include: {
          city: true,
        },
      });

      if (!record) {
        return null;
      }

      return {
        cityId: record.city.id,
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
      };
    }

    // no coordinates provided, find any matching city
    const cities = await context.prisma.city.findMany({
      where: { name: cityName },
    });

    if (cities.length === 0) {
      return null;
    }

    // get sunshine record for the first matching city
    const cityIds = cities.map((c: City) => c.id);
    const record = await context.prisma.monthlySunshine.findFirst({
      where: {
        cityId: { in: cityIds },
      },
      include: {
        city: true,
      },
    });

    if (!record) {
      return null;
    }

    return {
      cityId: record.city.id,
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
    };
  },
});
