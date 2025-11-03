import { PrismaClient, Prisma } from '@prisma/client';
import { MAX_CITIES_GLOBAL_VIEW, QUOTA_THRESHOLDS } from '../const';

interface QueryCityIdsParams {
  prisma: PrismaClient;
  dateStr: string;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLong: number;
    maxLong: number;
  };
}

/**
 * shared query logic for fetching city ids with smart distribution.
 * uses window functions to:
 * 1. rank cities by population per country
 * 2. identify temperature extremes (hottest/coldest) per country
 * 3. apply adaptive quotas based on country count
 * 4. return balanced set of cities (population + temperature extremes)
 */
export async function queryCityIds({
  prisma,
  dateStr,
  bounds,
}: QueryCityIdsParams): Promise<number[]> {
  // build WHERE clause based on whether bounds are provided
  const boundsCondition = bounds
    ? Prisma.sql`
        AND c.lat BETWEEN ${bounds.minLat} AND ${bounds.maxLat}
        AND c.long BETWEEN ${bounds.minLong} AND ${bounds.maxLong}
      `
    : Prisma.empty;

  const cityIds = await prisma.$queryRaw<Array<{ id: number }>>`
    WITH city_weather AS (
      -- get all cities with weather data and temperature rankings
      SELECT 
        c.id,
        c.country,
        c.population,
        wr."TAVG" as avg_temp,
        ROW_NUMBER() OVER (
          PARTITION BY c.country 
          ORDER BY c.population DESC NULLS LAST
        ) as pop_rank,
        ROW_NUMBER() OVER (
          PARTITION BY c.country 
          ORDER BY wr."TAVG" DESC NULLS LAST
        ) as hot_rank,
        ROW_NUMBER() OVER (
          PARTITION BY c.country 
          ORDER BY wr."TAVG" ASC NULLS LAST
        ) as cold_rank
      FROM cities c
      INNER JOIN weather_records wr ON wr."cityId" = c.id
      WHERE wr.date = ${dateStr} 
        AND wr."TAVG" IS NOT NULL
        ${boundsCondition}
    ),
    ranked_cities AS (
      -- keep all cities (no pre-filtering by population rank)
      -- temperature extremes are marked for priority
      SELECT 
        id,
        country,
        population,
        pop_rank,
        CASE 
          WHEN hot_rank = 1 THEN true
          WHEN cold_rank = 1 THEN true
          ELSE false
        END as is_temp_extreme
      FROM city_weather
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
        END as max_per_country,
        total_countries
      FROM country_stats
    ),
    selected_cities AS (
      -- apply quotas and select cities
      SELECT rc.id, rc.is_temp_extreme, rc.pop_rank, rc.population
      FROM ranked_cities rc
      CROSS JOIN quota_calc qc
      WHERE rc.is_temp_extreme = true OR rc.pop_rank <= qc.max_per_country
      ORDER BY 
        rc.is_temp_extreme DESC,
        rc.pop_rank,
        rc.population DESC NULLS LAST
    ),
    city_count AS (
      -- count how many cities we have so far
      SELECT COUNT(*) as current_count FROM selected_cities
    ),
    additional_cities AS (
      -- if we have fewer than target, add more cities by population
      SELECT rc.id
      FROM ranked_cities rc
      CROSS JOIN city_count cc
      WHERE cc.current_count < ${MAX_CITIES_GLOBAL_VIEW}
        AND rc.id NOT IN (SELECT id FROM selected_cities)
      ORDER BY rc.population DESC NULLS LAST
      LIMIT ${MAX_CITIES_GLOBAL_VIEW} - (SELECT current_count FROM city_count)
    )
    -- combine quota-based cities with additional cities to reach target
    SELECT id FROM selected_cities
    UNION ALL
    SELECT id FROM additional_cities
    LIMIT ${MAX_CITIES_GLOBAL_VIEW}
  `;

  return cityIds.map((c) => c.id);
}
