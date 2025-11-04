import { PrismaClient, Prisma } from '@prisma/client';
import { MAX_CITIES_GLOBAL_VIEW } from '../const';

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
 * shared query logic for fetching city ids with area-based distribution.
 * uses window functions to:
 * 1. calculate approximate area for each country in visible region
 * 2. distribute cities proportionally by area (large countries get more cities)
 * 3. rank cities by population within each country
 * 4. ensure every country gets at least 1 city (minimum representation)
 * 
 * this algorithm works for both global and zoomed views:
 * - global: area = country's total area → large countries get more cities
 * - zoomed: area = country's visible area → adapts to visible region
 */
async function queryCityIds({ prisma, dateStr, bounds }: QueryCityIdsParams): Promise<number[]> {
  // build WHERE clause based on whether bounds are provided
  const boundsCondition = bounds
    ? Prisma.sql`
        AND c.lat BETWEEN ${bounds.minLat} AND ${bounds.maxLat}
        AND c.long BETWEEN ${bounds.minLong} AND ${bounds.maxLong}
      `
    : Prisma.empty;

  const cityIds = await prisma.$queryRaw<Array<{ id: number }>>`
    WITH city_weather AS (
      -- get all cities with weather data in visible region
      SELECT 
        c.id,
        c.country,
        c.lat,
        c.long,
        c.population
      FROM cities c
      INNER JOIN weather_records wr ON wr."cityId" = c.id
      WHERE wr.date = ${dateStr} 
        AND wr."TAVG" IS NOT NULL
        ${boundsCondition}
    ),
    country_areas AS (
      -- calculate approximate area for each country in visible region
      -- uses bounding box: (max_lat - min_lat) * (max_long - min_long)
      SELECT 
        country,
        (MAX(lat) - MIN(lat)) * (MAX(long) - MIN(long)) as area,
        COUNT(*) as available_cities
      FROM city_weather
      GROUP BY country
    ),
    total_visible_area AS (
      -- sum of all country areas in visible region
      SELECT SUM(area) as total FROM country_areas
    ),
    country_quotas AS (
      -- distribute cities proportionally by area
      -- every country gets at least 1 city (minimum representation)
      SELECT 
        ca.country,
        ca.area,
        ca.available_cities,
        GREATEST(
          1,  -- minimum 1 city per country
          LEAST(
            ca.available_cities,  -- can't exceed available cities
            FLOOR((ca.area / NULLIF(tva.total, 0)) * ${MAX_CITIES_GLOBAL_VIEW})
          )
        ) as quota
      FROM country_areas ca
      CROSS JOIN total_visible_area tva
    ),
    ranked_cities AS (
      -- rank cities by population within each country
      SELECT 
        cw.id,
        cw.country,
        cw.population,
        ROW_NUMBER() OVER (
          PARTITION BY cw.country 
          ORDER BY cw.population DESC NULLS LAST
        ) as rank
      FROM city_weather cw
    ),
    selected_cities AS (
      -- select top N cities per country based on area-weighted quota
      SELECT rc.id, rc.population
      FROM ranked_cities rc
      INNER JOIN country_quotas cq ON cq.country = rc.country
      WHERE rc.rank <= cq.quota
      ORDER BY rc.population DESC NULLS LAST
    ),
    city_count AS (
      -- count how many cities we have so far
      SELECT COUNT(*) as current_count FROM selected_cities
    ),
    additional_cities AS (
      -- if we have fewer than target, add more cities by population
      -- this handles edge cases where area-based distribution doesn't fill quota
      SELECT rc.id
      FROM ranked_cities rc
      CROSS JOIN city_count cc
      WHERE cc.current_count < ${MAX_CITIES_GLOBAL_VIEW}
        AND rc.id NOT IN (SELECT id FROM selected_cities)
      ORDER BY rc.population DESC NULLS LAST
      LIMIT ${MAX_CITIES_GLOBAL_VIEW} - (SELECT current_count FROM city_count)
    )
    -- combine area-based cities with additional cities to reach target
    SELECT id FROM selected_cities
    UNION ALL
    SELECT id FROM additional_cities
    LIMIT ${MAX_CITIES_GLOBAL_VIEW}
  `;

  return cityIds.map((c) => c.id);
}

export default queryCityIds;
