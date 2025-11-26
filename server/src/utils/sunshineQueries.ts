import { PrismaClient, Prisma } from '@prisma/client';
import { MAX_CITIES_GLOBAL_VIEW, MONTH_FIELDS } from '../const';

// grid configuration for zoomed views
const GRID_SIZE = 10; // 10x10 = 100 cells for spatial distribution
const MIN_CITIES_PER_CELL = 1; // ensure at least 1 city per populated cell

interface QuerySunshineCityIdsParams {
  prisma: PrismaClient;
  month: number;
  bounds?: {
    minLat: number;
    maxLat: number;
    minLong: number;
    maxLong: number;
  };
}

/**
 * Shared query logic for fetching sunshine city ids with spatial distribution.
 * Uses grid-based distribution for bounds queries, population-based for global queries.
 */
async function querySunshineCityIds({
  prisma,
  month,
  bounds,
}: QuerySunshineCityIdsParams): Promise<number[]> {
  const monthIndex = month - 1;
  const monthField = MONTH_FIELDS[monthIndex];

  if (!monthField) {
    console.warn(`querySunshineCityIds: invalid month ${month}`);
    return [];
  }

  // use grid-based distribution for zoomed views, population-based for global view
  if (bounds) {
    return querySunshineCityIdsWithGridDistribution({ prisma, monthField, bounds });
  }
  return querySunshineCityIdsWithPopulationSort({ prisma, monthField });
}

/**
 * Grid-based distribution for zoomed/bounds queries.
 * Divides viewport into grid cells and distributes cities evenly across cells.
 */
async function querySunshineCityIdsWithGridDistribution({
  prisma,
  monthField,
  bounds,
}: {
  prisma: PrismaClient;
  monthField: string;
  bounds: { minLat: number; maxLat: number; minLong: number; maxLong: number };
}): Promise<number[]> {
  const { minLat, maxLat, minLong, maxLong } = bounds;

  // calculate grid cell dimensions
  const latStep = (maxLat - minLat) / GRID_SIZE;
  const longStep = (maxLong - minLong) / GRID_SIZE;

  const cityIds = await prisma.$queryRaw<Array<{ cityId: number }>>`
    WITH sunshine_cities AS (
      -- get all cities with sunshine data in visible region
      SELECT
        ms."cityId",
        c.country,
        c.lat,
        c.long,
        c.population,
        ms.${Prisma.raw(monthField)} as sunshine_value
      FROM monthly_sunshine ms
      INNER JOIN cities c ON c.id = ms."cityId"
      WHERE ms.${Prisma.raw(monthField)} IS NOT NULL
        AND c.lat BETWEEN ${minLat} AND ${maxLat}
        AND c.long BETWEEN ${minLong} AND ${maxLong}
    ),
    grid_cells AS (
      -- assign each city to a grid cell
      SELECT
        sc."cityId",
        sc.country,
        sc.population,
        FLOOR((sc.lat - ${minLat}) / ${latStep}) as cell_lat,
        FLOOR((sc.long - ${minLong}) / ${longStep}) as cell_long
      FROM sunshine_cities sc
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
        gc."cityId",
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
      SELECT rc."cityId", rc.population
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
      SELECT rc."cityId"
      FROM ranked_cities rc
      CROSS JOIN city_count cc
      WHERE cc.current_count < ${MAX_CITIES_GLOBAL_VIEW}
        AND rc."cityId" NOT IN (SELECT "cityId" FROM selected_cities)
      ORDER BY rc.population DESC NULLS LAST
      LIMIT ${MAX_CITIES_GLOBAL_VIEW} - (SELECT current_count FROM city_count)
    )
    -- combine grid-based cities with additional cities to reach target
    SELECT "cityId" FROM selected_cities
    UNION ALL
    SELECT "cityId" FROM additional_cities
    LIMIT ${MAX_CITIES_GLOBAL_VIEW}
  `;

  return cityIds.map((c) => c.cityId);
}

/**
 * Simple population-based sorting for global queries.
 */
async function querySunshineCityIdsWithPopulationSort({
  prisma,
  monthField,
}: {
  prisma: PrismaClient;
  monthField: string;
}): Promise<number[]> {
  const cityIds = await prisma.$queryRaw<Array<{ cityId: number }>>`
    SELECT ms."cityId"
    FROM monthly_sunshine ms
    INNER JOIN cities c ON c.id = ms."cityId"
    WHERE ms.${Prisma.raw(monthField)} IS NOT NULL
    ORDER BY c.population DESC NULLS LAST
    LIMIT ${MAX_CITIES_GLOBAL_VIEW}
  `;

  return cityIds.map((c) => c.cityId);
}

export default querySunshineCityIds;
export {
  querySunshineCityIdsWithGridDistribution,
  querySunshineCityIdsWithPopulationSort,
};
