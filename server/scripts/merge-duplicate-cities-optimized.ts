/**
 * Merge Duplicate Cities - PRCP Data Consolidation (Efficient Approach)
 *
 * PROBLEM THIS SOLVES:
 * Weather data from NOAA often comes from multiple weather stations in the same city,
 * resulting in duplicate city entries in our database. Some stations only report
 * temperature data (TAVG/TMAX/TMIN), while others only report precipitation (PRCP).
 * This creates an incomplete picture where we have cities with temperature but no
 * precipitation data, and vice versa.
 *
 * WHAT THIS SCRIPT DOES:
 * This script consolidates weather data from duplicate city entries by:
 * 1. Identifying cities that have temperature data but are missing precipitation data
 * 2. Finding duplicate cities (same name, country, state) that have precipitation data
 * 3. Transferring precipitation data to the temperature-containing cities by matching dates
 * 4. Filling any remaining gaps in precipitation coverage from other duplicate sources
 * 5. Deleting all cities that only have precipitation data (no temperature)
 * 6. Managing weather station associations to prevent duplicates
 *
 * WHY TEMPERATURE TAKES PRIORITY:
 * Temperature data is the primary metric for our application's use case (vacation planning).
 * Precipitation is supplementary information. Therefore, we keep cities with temperature
 * data and enhance them with precipitation, rather than the other way around.
 *
 * EFFICIENT APPROACH:
 * Instead of processing all duplicate city groups (which would be thousands), this script:
 * 1. Finds only cities with TEMP but no PRCP (the subset that needs enhancement)
 * 2. For each TEMP-only city, finds duplicate cities with PRCP data
 * 3. Transfers PRCP data by matching dates between weather records
 * 4. Fills any remaining PRCP gaps from cities with complete data
 * 5. Deletes ALL PRCP-only cities in one final sweep
 *
 * WHY THIS IS BETTER THAN NAIVE APPROACH:
 * - Most duplicate groups already have cities with BOTH temp & PRCP (no action needed)
 * - Only a small subset have TEMP-only cities that need PRCP enhancement
 * - By focusing on TEMP-only cities, we skip processing thousands of groups unnecessarily
 * - Single final deletion sweep is more efficient than deleting cities one-by-one
 *
 * EXAMPLE SCENARIO:
 * Before:
 *   - City A (Rome, Italy): Has TAVG, TMAX, TMIN for all dates, but no PRCP
 *   - City B (Rome, Italy): Has only PRCP for all dates, no temperature
 *   - City C (Rome, Italy): Has both TEMP and PRCP for all dates
 *
 * After:
 *   - City A (Rome, Italy): Now has TAVG, TMAX, TMIN, and PRCP for all dates
 *   - City B: Deleted (PRCP-only city)
 *   - City C: Unchanged (already complete)
 *
 * WEATHER STATION HANDLING:
 * When merging cities, the script also handles weather station associations:
 * - If a station name already exists in the target city, the duplicate is deleted
 * - If a station name is unique, it's reassigned to the target city
 * - This prevents duplicate station entries while preserving unique data sources
 *
 * USAGE:
 * Run this script after importing weather data to consolidate duplicate cities:
 *   npm run merge-duplicates
 * or:
 *   npx ts-node server/scripts/merge-duplicate-cities-optimized.ts
 *
 * PREREQUISITES:
 * - Database must be populated with cities and weather records
 * - Backup recommended before running (script modifies and deletes data)
 *
 * PERFORMANCE:
 * - Processes cities in batches with progress reporting
 * - Uses efficient SQL queries with proper indexing
 * - Typical runtime: 5-15 minutes depending on database size
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MergeStats {
  tempOnlyCitiesFound: number;
  tempOnlyCitiesUpdated: number;
  weatherRecordsUpdated: number;
  prcpOnlyCitiesDeleted: number;
  weatherRecordsDeleted: number;
  stationsReassigned: number;
  stationsDeleted: number;
}

async function mergeDuplicateCities() {
  console.log('🔄 Merging Duplicate Cities - PRCP Data Consolidation (Efficient)');
  console.log('='.repeat(80));

  const stats: MergeStats = {
    tempOnlyCitiesFound: 0,
    tempOnlyCitiesUpdated: 0,
    weatherRecordsUpdated: 0,
    prcpOnlyCitiesDeleted: 0,
    weatherRecordsDeleted: 0,
    stationsReassigned: 0,
    stationsDeleted: 0,
  };

  try {
    // step 1: find cities with TEMP but no PRCP
    console.log('\n📊 Step 1: Finding cities with TEMP data but no PRCP...\n');

    const tempOnlyCities = await prisma.$queryRaw<
      Array<{ id: number; name: string; country: string; state: string | null }>
    >`
      SELECT DISTINCT c.id, c.name, c.country, c.state
      FROM cities c
      WHERE EXISTS (
        SELECT 1 FROM weather_records wr
        WHERE wr."cityId" = c.id
        AND (wr."TAVG" IS NOT NULL OR wr."TMAX" IS NOT NULL OR wr."TMIN" IS NOT NULL)
      )
      AND NOT EXISTS (
        SELECT 1 FROM weather_records wr
        WHERE wr."cityId" = c.id
        AND wr."PRCP" IS NOT NULL
      )
      ORDER BY c.name, c.country, c.state
    `;

    console.log(`  ✓ Found ${tempOnlyCities.length} cities with TEMP but no PRCP`);
    stats.tempOnlyCitiesFound = tempOnlyCities.length;

    if (tempOnlyCities.length === 0) {
      console.log('\n  No TEMP-only cities found. Skipping to PRCP-only cleanup...\n');
    } else {
      // step 2: for each TEMP-only city, find and merge PRCP data from duplicates
      console.log('\n📊 Step 2: Transferring PRCP data to TEMP-only cities...\n');

      for (let i = 0; i < tempOnlyCities.length; i++) {
        const targetCity = tempOnlyCities[i];

        // check if this city still needs PRCP data (might have been updated by previous merges)
        const stillNeedsPrcp = await prisma.$queryRaw<Array<{ needs_prcp: boolean }>>`
          SELECT NOT EXISTS (
            SELECT 1 FROM weather_records wr
            WHERE wr."cityId" = ${targetCity.id}
            AND wr."PRCP" IS NOT NULL
          ) as needs_prcp
        `;

        if (!stillNeedsPrcp[0].needs_prcp) {
          // Skip - already has PRCP data (updated by previous merge)
          continue;
        }

        // find duplicate cities (same name, country, state) with PRCP data
        const prcpCities = targetCity.state
          ? await prisma.$queryRaw<Array<{ id: number }>>`
              SELECT DISTINCT c.id
              FROM cities c
              WHERE c.name = ${targetCity.name}
              AND c.country = ${targetCity.country}
              AND c.state = ${targetCity.state}
              AND c.id != ${targetCity.id}
              AND EXISTS (
                SELECT 1 FROM weather_records wr
                WHERE wr."cityId" = c.id
                AND wr."PRCP" IS NOT NULL
              )
            `
          : await prisma.$queryRaw<Array<{ id: number }>>`
              SELECT DISTINCT c.id
              FROM cities c
              WHERE c.name = ${targetCity.name}
              AND c.country = ${targetCity.country}
              AND c.state IS NULL
              AND c.id != ${targetCity.id}
              AND EXISTS (
                SELECT 1 FROM weather_records wr
                WHERE wr."cityId" = c.id
                AND wr."PRCP" IS NOT NULL
              )
            `;

        if (prcpCities.length > 0) {
          console.log(
            `  [${i + 1}/${tempOnlyCities.length}] ${targetCity.name}${targetCity.state ? `, ${targetCity.state}` : ''}, ${targetCity.country}`
          );
          console.log(`    Found ${prcpCities.length} duplicate cities with PRCP data`);

          let recordsUpdated = 0;
          let stationsReassigned = 0;
          let stationsDeleted = 0;

          // transfer PRCP data from each duplicate
          for (const prcpCity of prcpCities) {
            // batch update PRCP data
            const updated = await prisma.$executeRaw`
              UPDATE weather_records AS target
              SET "PRCP" = source."PRCP"
              FROM weather_records AS source
              WHERE target."cityId" = ${targetCity.id}
                AND source."cityId" = ${prcpCity.id}
                AND target.date = source.date
                AND target."PRCP" IS NULL
                AND source."PRCP" IS NOT NULL
            `;
            recordsUpdated += updated;

            // handle weather stations
            const prcpStations = await prisma.weatherStation.findMany({
              where: { cityId: prcpCity.id },
              select: { id: true, name: true },
            });

            if (prcpStations.length > 0) {
              const targetStations = await prisma.weatherStation.findMany({
                where: { cityId: targetCity.id },
                select: { name: true },
              });

              const targetStationNames = new Set(targetStations.map((s) => s.name));
              const stationsToDelete: number[] = [];
              const stationsToReassign: number[] = [];

              for (const station of prcpStations) {
                if (targetStationNames.has(station.name)) {
                  stationsToDelete.push(station.id);
                } else {
                  stationsToReassign.push(station.id);
                }
              }

              if (stationsToDelete.length > 0) {
                const deleted = await prisma.weatherStation.deleteMany({
                  where: { id: { in: stationsToDelete } },
                });
                stationsDeleted += deleted.count;
              }

              if (stationsToReassign.length > 0) {
                const reassigned = await prisma.weatherStation.updateMany({
                  where: { id: { in: stationsToReassign } },
                  data: { cityId: targetCity.id },
                });
                stationsReassigned += reassigned.count;
              }
            }
          }

          if (recordsUpdated > 0) {
            console.log(`    ✓ Updated ${recordsUpdated} weather records with PRCP data`);
            stats.tempOnlyCitiesUpdated++;
            stats.weatherRecordsUpdated += recordsUpdated;
          } else {
            console.log(`    ⊘ No overlapping dates - cannot transfer PRCP data`);
          }

          if (stationsReassigned > 0) {
            console.log(`    ✓ Reassigned ${stationsReassigned} stations`);
            stats.stationsReassigned += stationsReassigned;
          }
          if (stationsDeleted > 0) {
            console.log(`    ✓ Deleted ${stationsDeleted} duplicate stations`);
            stats.stationsDeleted += stationsDeleted;
          }
        }

        // show progress every 50 cities
        if ((i + 1) % 50 === 0) {
          const percentage = (((i + 1) / tempOnlyCities.length) * 100).toFixed(1);
          console.log(`\n  📈 Progress: ${i + 1}/${tempOnlyCities.length} cities (${percentage}%)`);
          console.log(
            `     Records updated so far: ${stats.weatherRecordsUpdated.toLocaleString()}\n`
          );
        }
      }
    }

    // step 3: fill gaps in PRCP data for cities with incomplete coverage
    console.log('\n📊 Step 3: Filling PRCP gaps for cities with incomplete coverage...\n');

    // find cities that have TEMP but incomplete PRCP (some records missing PRCP)
    const citiesWithGaps = await prisma.$queryRaw<
      Array<{ id: number; name: string; country: string; state: string | null }>
    >`
      SELECT DISTINCT c.id, c.name, c.country, c.state
      FROM cities c
      WHERE EXISTS (
        SELECT 1 FROM weather_records wr
        WHERE wr."cityId" = c.id
        AND (wr."TAVG" IS NOT NULL OR wr."TMAX" IS NOT NULL OR wr."TMIN" IS NOT NULL)
        AND wr."PRCP" IS NULL
      )
      ORDER BY c.name, c.country, c.state
    `;

    console.log(`  Found ${citiesWithGaps.length} cities with PRCP gaps`);

    if (citiesWithGaps.length > 0) {
      let gapsFilled = 0;

      for (let i = 0; i < citiesWithGaps.length; i++) {
        const targetCity = citiesWithGaps[i];

        // find duplicate cities with complete data (BOTH temp & prcp on same records)
        const sourceCities = targetCity.state
          ? await prisma.$queryRaw<Array<{ id: number }>>`
              SELECT DISTINCT c.id
              FROM cities c
              WHERE c.name = ${targetCity.name}
              AND c.country = ${targetCity.country}
              AND c.state = ${targetCity.state}
              AND c.id != ${targetCity.id}
              AND EXISTS (
                SELECT 1 FROM weather_records wr
                WHERE wr."cityId" = c.id
                AND wr."PRCP" IS NOT NULL
                AND (wr."TAVG" IS NOT NULL OR wr."TMAX" IS NOT NULL OR wr."TMIN" IS NOT NULL)
              )
            `
          : await prisma.$queryRaw<Array<{ id: number }>>`
              SELECT DISTINCT c.id
              FROM cities c
              WHERE c.name = ${targetCity.name}
              AND c.country = ${targetCity.country}
              AND c.state IS NULL
              AND c.id != ${targetCity.id}
              AND EXISTS (
                SELECT 1 FROM weather_records wr
                WHERE wr."cityId" = c.id
                AND wr."PRCP" IS NOT NULL
                AND (wr."TAVG" IS NOT NULL OR wr."TMAX" IS NOT NULL OR wr."TMIN" IS NOT NULL)
              )
            `;

        if (sourceCities.length > 0) {
          let recordsUpdated = 0;

          for (const sourceCity of sourceCities) {
            const updated = await prisma.$executeRaw`
              UPDATE weather_records AS target
              SET "PRCP" = source."PRCP"
              FROM weather_records AS source
              WHERE target."cityId" = ${targetCity.id}
                AND source."cityId" = ${sourceCity.id}
                AND target.date = source.date
                AND target."PRCP" IS NULL
                AND source."PRCP" IS NOT NULL
            `;
            recordsUpdated += updated;
          }

          if (recordsUpdated > 0) {
            gapsFilled++;
            stats.weatherRecordsUpdated += recordsUpdated;
          }
        }

        if ((i + 1) % 100 === 0) {
          const percentage = (((i + 1) / citiesWithGaps.length) * 100).toFixed(1);
          console.log(`  📈 Progress: ${i + 1}/${citiesWithGaps.length} cities (${percentage}%)`);
        }
      }

      console.log(`  ✓ Filled PRCP gaps for ${gapsFilled} cities`);
      console.log(
        `  ✓ Updated ${stats.weatherRecordsUpdated.toLocaleString()} additional records\n`
      );
    }

    // step 4: delete ALL PRCP-only cities
    console.log('\n📊 Step 4: Deleting all PRCP-only cities...\n');

    const prcpOnlyCities = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT c.id
      FROM cities c
      WHERE EXISTS (
        SELECT 1 FROM weather_records wr
        WHERE wr."cityId" = c.id
        AND wr."PRCP" IS NOT NULL
      )
      AND NOT EXISTS (
        SELECT 1 FROM weather_records wr
        WHERE wr."cityId" = c.id
        AND (wr."TAVG" IS NOT NULL OR wr."TMAX" IS NOT NULL OR wr."TMIN" IS NOT NULL)
      )
    `;

    console.log(`  Found ${prcpOnlyCities.length} PRCP-only cities to delete`);

    if (prcpOnlyCities.length > 0) {
      const cityIds = prcpOnlyCities.map((c) => c.id);
      const batchSize = 1000; // Process 1000 cities at a time

      // delete weather records in batches
      console.log('  Deleting weather records in batches...');
      let totalRecordsDeleted = 0;
      for (let i = 0; i < cityIds.length; i += batchSize) {
        const batch = cityIds.slice(i, i + batchSize);
        const deletedRecords = await prisma.weatherRecord.deleteMany({
          where: { cityId: { in: batch } },
        });
        totalRecordsDeleted += deletedRecords.count;

        if ((i + batch.length) % 5000 === 0 || i + batch.length === cityIds.length) {
          console.log(`    Progress: ${i + batch.length}/${cityIds.length} cities processed, ${totalRecordsDeleted.toLocaleString()} records deleted`);
        }
      }
      stats.weatherRecordsDeleted = totalRecordsDeleted;
      console.log(`  ✓ Deleted ${totalRecordsDeleted.toLocaleString()} weather records`);

      // delete weather stations in batches
      console.log('  Deleting weather stations in batches...');
      let totalStationsDeleted = 0;
      for (let i = 0; i < cityIds.length; i += batchSize) {
        const batch = cityIds.slice(i, i + batchSize);
        const deletedStations = await prisma.weatherStation.deleteMany({
          where: { cityId: { in: batch } },
        });
        totalStationsDeleted += deletedStations.count;

        if ((i + batch.length) % 5000 === 0 || i + batch.length === cityIds.length) {
          console.log(`    Progress: ${i + batch.length}/${cityIds.length} cities processed, ${totalStationsDeleted.toLocaleString()} stations deleted`);
        }
      }
      console.log(`  ✓ Deleted ${totalStationsDeleted.toLocaleString()} weather stations`);

      // delete cities in batches
      console.log('  Deleting cities in batches...');
      let totalCitiesDeleted = 0;
      for (let i = 0; i < cityIds.length; i += batchSize) {
        const batch = cityIds.slice(i, i + batchSize);
        const deletedCities = await prisma.city.deleteMany({
          where: { id: { in: batch } },
        });
        totalCitiesDeleted += deletedCities.count;

        if ((i + batch.length) % 5000 === 0 || i + batch.length === cityIds.length) {
          console.log(`    Progress: ${i + batch.length}/${cityIds.length} cities processed`);
        }
      }
      stats.prcpOnlyCitiesDeleted = totalCitiesDeleted;
      console.log(`  ✓ Deleted ${totalCitiesDeleted.toLocaleString()} cities`);
    }

    // final summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 Merge Complete!');
    console.log('='.repeat(80));
    console.log(`\n✅ TEMP-only cities found:      ${stats.tempOnlyCitiesFound.toLocaleString()}`);
    console.log(`✅ TEMP-only cities updated:    ${stats.tempOnlyCitiesUpdated.toLocaleString()}`);
    console.log(`🔄 Weather records updated:     ${stats.weatherRecordsUpdated.toLocaleString()}`);
    console.log(`🗑️  PRCP-only cities deleted:    ${stats.prcpOnlyCitiesDeleted.toLocaleString()}`);
    console.log(`🗑️  Weather records deleted:     ${stats.weatherRecordsDeleted.toLocaleString()}`);
    console.log(`🏢 Weather stations reassigned: ${stats.stationsReassigned.toLocaleString()}`);
    console.log(`🗑️  Weather stations deleted:    ${stats.stationsDeleted.toLocaleString()}`);

    // verify final state
    const finalCityCount = await prisma.city.count();
    const finalRecordCount = await prisma.weatherRecord.count();
    const finalStationCount = await prisma.weatherStation.count();

    console.log(`\n🗄️  Final database state:`);
    console.log(`  • Cities:           ${finalCityCount.toLocaleString()}`);
    console.log(`  • Weather records:  ${finalRecordCount.toLocaleString()}`);
    console.log(`  • Weather stations: ${finalStationCount.toLocaleString()}`);
    console.log(`\n${'='.repeat(80)}`);
  } catch (error) {
    console.error('❌ Error during merge:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// main execution
async function main() {
  console.log('\n⚠️  WARNING: This script will modify your database!');
  console.log('It will merge PRCP data into existing temperature records by date.');
  console.log('Make sure you have a backup before proceeding.\n');

  await mergeDuplicateCities();
}

main().catch((error) => {
  console.error('💥 Merge failed:', error);
  process.exit(1);
});
