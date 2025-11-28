import { PrismaClient } from '@prisma/client';
import { MAX_CITIES_GLOBAL_VIEW } from '../const';

// grid configuration for zoomed views
const GRID_SIZE = 10; // 10x10 = 100 cells for spatial distribution
const MIN_CITIES_PER_CELL = 1; // ensure at least 1 city per populated cell

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
 * Grid-based distribution for zoomed/bounds queries.
 * Divides viewport into grid cells and distributes cities evenly across cells.
 * This ensures full viewport coverage when zoomed in.
 */
async function queryCityIdsWithGridDistribution({
  prisma,
  dateStr,
  bounds,
}: Required<QueryCityIdsParams>): Promise<number[]> {
  const { minLat, maxLat, minLong, maxLong } = bounds;

  // calculate grid cell dimensions
  const latStep = (maxLat - minLat) / GRID_SIZE;
  const longStep = (maxLong - minLong) / GRID_SIZE;

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
        AND c.lat BETWEEN ${minLat} AND ${maxLat}
        AND c.long BETWEEN ${minLong} AND ${maxLong}
    ),
    grid_cells AS (
      -- assign each city to a grid cell
      SELECT
        cw.id,
        cw.country,
        cw.population,
        FLOOR((cw.lat - ${minLat}) / ${latStep}) as cell_lat,
        FLOOR((cw.long - ${minLong}) / ${longStep}) as cell_long
      FROM city_weather cw
    ),
    cell_stats AS (
      -- calculate statistics for each grid cell
      SELECT
        cell_lat,
        cell_long,
        COUNT(*) as cities_in_cell
      FROM grid_cells
      GROUP BY cell_lat, cell_long
    ),
    total_populated_cells AS (
      -- count how many cells have cities
      SELECT COUNT(*) as cell_count FROM cell_stats
    ),
    cell_quotas AS (
      -- distribute cities evenly across populated cells
      SELECT
        cs.cell_lat,
        cs.cell_long,
        cs.cities_in_cell,
        GREATEST(
          ${MIN_CITIES_PER_CELL},  -- minimum per cell
          LEAST(
            cs.cities_in_cell,  -- can't exceed available
            FLOOR(${MAX_CITIES_GLOBAL_VIEW}::float / NULLIF((SELECT cell_count FROM total_populated_cells), 0))
          )
        ) as quota
      FROM cell_stats cs
    ),
    ranked_cities AS (
      -- rank cities by population within each grid cell
      SELECT
        gc.id,
        gc.cell_lat,
        gc.cell_long,
        gc.population,
        ROW_NUMBER() OVER (
          PARTITION BY gc.cell_lat, gc.cell_long
          ORDER BY gc.population DESC NULLS LAST
        ) as rank
      FROM grid_cells gc
    ),
    selected_cities AS (
      -- select top N cities per cell based on quota
      SELECT rc.id, rc.population
      FROM ranked_cities rc
      INNER JOIN cell_quotas cq 
        ON cq.cell_lat = rc.cell_lat 
        AND cq.cell_long = rc.cell_long
      WHERE rc.rank <= cq.quota
      ORDER BY rc.population DESC NULLS LAST
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
    -- combine grid-based cities with additional cities to reach target
    SELECT id FROM selected_cities
    UNION ALL
    SELECT id FROM additional_cities
    LIMIT ${MAX_CITIES_GLOBAL_VIEW}
  `;

  return cityIds.map((c) => c.id);
}

/**
 * Country-based distribution for global queries.
 * Uses area-weighted allocation to balance representation across countries.
 */
async function queryCityIdsWithCountryDistribution({
  prisma,
  dateStr,
}: Omit<QueryCityIdsParams, 'bounds'>): Promise<number[]> {
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
    ),
    country_areas AS (
      -- calculate approximate area for each country in visible region
      -- use square root to reduce dominance of large countries
      -- this gives more balanced representation across all countries
      SELECT
        country,
        SQRT((MAX(lat) - MIN(lat)) * (MAX(long) - MIN(long))) as area,
        COUNT(*) as available_cities
      FROM city_weather
      GROUP BY country
    ),
    total_visible_area AS (
      -- sum of all country areas in visible region
      SELECT SUM(area) as total FROM country_areas
    ),
    country_quotas AS (
      -- distribute cities more evenly across countries
      -- base allocation: equal distribution, then add small bonus based on area
      -- this prevents large countries from dominating while still giving them slightly more representation
      SELECT
        ca.country,
        ca.area,
        ca.available_cities,
        GREATEST(
          1,  -- minimum 1 city per country
          LEAST(
            ca.available_cities,  -- can't exceed available cities
            FLOOR(
              -- base allocation: equal share across all countries
              (${MAX_CITIES_GLOBAL_VIEW} / (SELECT COUNT(*) FROM country_areas)::float) +
              -- small area bonus (only 20% of the total budget)
              ((ca.area / NULLIF(tva.total, 0)) * ${MAX_CITIES_GLOBAL_VIEW} * 0.2)
            )
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
  // use grid-based distribution for zoomed views, country-based for global view
  if (bounds) {
    return queryCityIdsWithGridDistribution({ prisma, dateStr, bounds });
  }
  return queryCityIdsWithCountryDistribution({ prisma, dateStr });
}

export default queryCityIds;
export { queryCityIdsWithGridDistribution, queryCityIdsWithCountryDistribution };
