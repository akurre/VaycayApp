/* eslint-disable */
/**
 * Reassign Small Cities to Major Cities
 *
 * This script identifies small cities that are within a specified radius of major cities
 * (population > 1.5M) and reassigns them to the major city. This ensures that major cities
 * appear on the map instead of tiny nearby suburbs.
 *
 * TBH this was supposed to be done in the other script, but some cities fell through the cracks.
 * Hence this script.
 *
 * The script:
 * 1. Reads major cities (population > 1.5M) from worldcities.csv
 * 2. For each major city, finds smaller cities within 15km
 * 3. Updates these smaller cities to use the major city's name and coordinates
 * 4. Logs all reassignments
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Utility function to extract counts without directly accessing _count
function getCounts(city: { _count: { weatherStations: number; weatherRecords: number } }) {
  return {
    weatherStations: city._count.weatherStations,
    weatherRecords: city._count.weatherRecords,
  };
}

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const dryRunArg = args.includes('--dry-run');
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const DRY_RUN = dryRunArg;

// Configuration
const MIN_MAJOR_CITY_POPULATION = 1500000; // 1.5 million
const SEARCH_RADIUS_KM = 35; // 35km radius
const WORLDCITIES_PATH = resolve(process.cwd(), '..', 'dataAndUtils', 'worldcities.csv');

interface WorldCity {
  city: string;
  city_ascii: string;
  lat: number;
  lng: number;
  country: string;
  iso2: string;
  iso3: string;
  admin_name: string | null;
  capital: string;
  population: number;
  id: string;
}

interface ReassignmentStats {
  majorCitiesFound: number;
  smallCitiesReassigned: number;
  weatherStationsReassigned: number;
  weatherRecordsAffected: number;
}

// Helper to parse CSV line respecting quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Helper to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

// Function to handle duplicate cities in the database
async function handleDuplicateCities() {
  // Get all cities grouped by name and country
  const cities = await prisma.city.findMany({
    select: {
      id: true,
      name: true,
      country: true,
      lat: true,
      long: true,
      _count: {
        select: {
          weatherStations: true,
          weatherRecords: true,
        },
      },
    },
  });

  // Group cities by name and country
  const cityGroups = new Map<string, typeof cities>();
  for (const city of cities) {
    const key = `${city.name}|${city.country}`;
    if (!cityGroups.has(key)) {
      cityGroups.set(key, []);
    }
    // Use array destructuring
    const [group] = [cityGroups.get(key)!];
    group.push(city);
  }

  // Find groups with more than one city (duplicates)
  let duplicateCount = 0;
  let totalStationsReassigned = 0;
  let totalRecordsReassigned = 0;

  for (const [, group] of cityGroups.entries()) {
    if (group.length > 1) {
      duplicateCount++;

      // Sort by number of weather records (descending)
      group.sort((a, b) => {
        const { weatherRecords: aRecords } = getCounts(a);
        const { weatherRecords: bRecords } = getCounts(b);
        return bRecords - aRecords;
      });

      // Keep the city with the most weather records
      const primaryCity = group[0];
      const duplicateCities = group.slice(1);

      // Process each duplicate
      for (const duplicateCity of duplicateCities) {
        // One-liner overview of the duplicate city
        const { weatherStations: stationCount, weatherRecords: recordCount } =
          getCounts(duplicateCity);
        console.log(
          `  ✓ Merging duplicate: ${duplicateCity.name}, ${duplicateCity.country} → ${primaryCity.name} (${stationCount} stations, ${recordCount} records)`
        );

        if (!DRY_RUN) {
          try {
            // Step 1: Reassign weather stations to the primary city
            const { weatherStations: stationCount } = getCounts(duplicateCity);
            if (stationCount > 0) {
              await prisma.weatherStation.updateMany({
                where: { cityId: duplicateCity.id },
                data: { cityId: primaryCity.id },
              });
              totalStationsReassigned += stationCount;
            }

            // Step 2: Reassign weather records to the primary city
            const { weatherRecords: recordCount } = getCounts(duplicateCity);
            if (recordCount > 0) {
              await prisma.weatherRecord.updateMany({
                where: { cityId: duplicateCity.id },
                data: { cityId: primaryCity.id },
              });
              totalRecordsReassigned += recordCount;
            }

            // Step 3: Delete the duplicate city
            await prisma.city.delete({
              where: { id: duplicateCity.id },
            });
          } catch (error) {
            console.error(`    ✗ Error merging duplicate city ${duplicateCity.name}: ${error}`);
          }
        }
      }
    }
  }

  if (duplicateCount === 0) {
    console.log('  ✓ No duplicate cities found');
  } else {
    console.log(
      `  ✓ Processed ${duplicateCount} sets of duplicate cities (${totalStationsReassigned} stations, ${totalRecordsReassigned} records reassigned)`
    );
  }
}

// Read major cities from worldcities.csv
async function readMajorCities(): Promise<WorldCity[]> {
  console.log(`\n📊 Reading major cities from ${WORLDCITIES_PATH}...`);

  try {
    const content = readFileSync(WORLDCITIES_PATH, 'utf-8');
    const lines = content.split('\n');
    const headers = parseCSVLine(lines[0]);

    const majorCities: WorldCity[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      const population = Number(row.population);
      if (population && population >= MIN_MAJOR_CITY_POPULATION) {
        majorCities.push({
          city: row.city.replace(/^"|"$/g, ''), // Remove quotes if present
          city_ascii: row.city_ascii,
          lat: Number(row.lat),
          lng: Number(row.lng),
          country: row.country,
          iso2: row.iso2,
          iso3: row.iso3,
          admin_name: row.admin_name || null,
          capital: row.capital,
          population,
          id: row.id,
        });
      }
    }

    console.log(
      `  ✓ Found ${majorCities.length} major cities with population >= ${MIN_MAJOR_CITY_POPULATION.toLocaleString()}`
    );
    return majorCities;
  } catch (error) {
    console.error(`  ✗ Error reading worldcities.csv:`, error);
    throw error;
  }
}

// Main function to reassign small cities to major cities
async function reassignCitiesToMajorCities() {
  console.log('🔄 Reassigning Small Cities to Major Cities');
  console.log('='.repeat(80));

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE: No database changes will be made');
  }

  if (LIMIT < Infinity) {
    console.log(`⚠️  LIMIT: Processing only the first ${LIMIT} major cities`);
  }

  // Capture initial database state
  const initialCityCount = await prisma.city.count();
  const initialStationCount = await prisma.weatherStation.count();
  const initialRecordCount = await prisma.weatherRecord.count();

  console.log(`\n📊 Initial database state:`);
  console.log(`  • Cities:           ${initialCityCount.toLocaleString()}`);
  console.log(`  • Weather stations: ${initialStationCount.toLocaleString()}`);
  console.log(`  • Weather records:  ${initialRecordCount.toLocaleString()}\n`);

  const stats: ReassignmentStats = {
    majorCitiesFound: 0,
    smallCitiesReassigned: 0,
    weatherStationsReassigned: 0,
    weatherRecordsAffected: 0,
  };

  // Step 0: First, let's handle duplicate cities in the database
  console.log('\n📊 Checking for duplicate cities in the database...');
  await handleDuplicateCities();

  try {
    // Step 1: Read major cities from worldcities.csv
    const majorCities = await readMajorCities();
    stats.majorCitiesFound = majorCities.length;

    // Step 2: Process each major city
    console.log('\n📊 Processing major cities and finding nearby smaller cities...\n');

    // Apply limit if specified
    const citiesToProcess = LIMIT < Infinity ? majorCities.slice(0, LIMIT) : majorCities;

    // Get a list of cities that need reassignment (cities with different names than major cities)
    console.log('\n📊 Finding cities that need reassignment...');

    // First pass: identify which major cities have nearby small cities that need reassignment
    const majorCitiesWithNearbyCities = new Set<string>();

    for (let i = 0; i < citiesToProcess.length; i++) {
      const majorCity = citiesToProcess[i];
      const majorCityKey = `${majorCity.city}|${majorCity.country}`;

      // Find the major city in our database
      const dbMajorCity = await prisma.city.findFirst({
        where: {
          name: majorCity.city,
          country: majorCity.country,
          // If admin_name is available, use it to match state
          ...(majorCity.admin_name ? { state: majorCity.admin_name } : {}),
        },
      });

      if (!dbMajorCity) {
        continue;
      }

      // Update the major city's coordinates to match worldcities.csv if needed
      if (dbMajorCity.lat !== majorCity.lat || dbMajorCity.long !== majorCity.lng) {
        if (!DRY_RUN) {
          try {
            await prisma.city.update({
              where: { id: dbMajorCity.id },
              data: {
                lat: majorCity.lat,
                long: majorCity.lng,
              },
            });
            console.log(`  ✓ Updated ${majorCity.city}'s coordinates to match worldcities.csv`);
          } catch (error) {
            console.error(`  ✗ Error updating ${majorCity.city}'s coordinates: ${error}`);
          }
        } else {
          console.log(
            `  ✓ [DRY RUN] Would update ${majorCity.city}'s coordinates to match worldcities.csv`
          );
        }
      }

      // Find all cities in the database with a different name in the same country
      const smallCities = await prisma.city.findMany({
        where: {
          id: { not: dbMajorCity.id },
          country: majorCity.country,
          name: { not: majorCity.city }, // Only cities with different names
        },
        select: { id: true, name: true, lat: true, long: true },
      });

      // Find cities within the specified radius
      const nearbyCities = smallCities.filter((city) => {
        const distance = calculateDistance(majorCity.lat, majorCity.lng, city.lat, city.long);
        return distance <= SEARCH_RADIUS_KM;
      });

      if (nearbyCities.length > 0) {
        majorCitiesWithNearbyCities.add(majorCityKey);
      }

      // Show progress
      if ((i + 1) % 50 === 0 || i === citiesToProcess.length - 1) {
        const percentage = (((i + 1) / citiesToProcess.length) * 100).toFixed(1);
        console.log(
          `  📊 Analyzed ${i + 1}/${citiesToProcess.length} major cities (${percentage}%)`
        );
      }
    }

    console.log(
      `  ✓ Found ${majorCitiesWithNearbyCities.size} major cities with nearby small cities to reassign`
    );

    // Second pass: process only major cities that have nearby small cities to reassign
    console.log('\n📊 Processing major cities with nearby small cities...\n');
    let processedCount = 0;

    for (let i = 0; i < citiesToProcess.length; i++) {
      const majorCity = citiesToProcess[i];
      const majorCityKey = `${majorCity.city}|${majorCity.country}`;

      // Skip major cities that don't have nearby small cities to reassign
      if (!majorCitiesWithNearbyCities.has(majorCityKey)) {
        continue;
      }

      processedCount++;
      console.log(
        `  [${processedCount}/${majorCitiesWithNearbyCities.size}] ${majorCity.city}, ${majorCity.country} (Pop: ${majorCity.population.toLocaleString()})`
      );

      // Find the major city in our database
      const dbMajorCity = await prisma.city.findFirst({
        where: {
          name: majorCity.city,
          country: majorCity.country,
          // If admin_name is available, use it to match state
          ...(majorCity.admin_name ? { state: majorCity.admin_name } : {}),
        },
      });

      if (!dbMajorCity) {
        console.log(`    ⚠️ Major city not found in database, skipping`);
        continue;
      }

      // Update the major city's coordinates if needed (silently)
      if (dbMajorCity.lat !== majorCity.lat || dbMajorCity.long !== majorCity.lng) {
        if (!DRY_RUN) {
          try {
            await prisma.city.update({
              where: { id: dbMajorCity.id },
              data: {
                lat: majorCity.lat,
                long: majorCity.lng,
              },
            });
          } catch (error) {
            console.error(`    ✗ Error updating ${majorCity.city}'s coordinates: ${error}`);
          }
        }
      }

      // Find all cities in the database
      const allCities = await prisma.city.findMany({
        where: {
          // Exclude the major city itself
          id: { not: dbMajorCity.id },
          // Optional: filter by country to speed up processing
          country: majorCity.country,
        },
        include: {
          // Count related records for logging
          weatherStations: { select: { id: true } },
          weatherRecords: { select: { id: true } },
        },
      });

      // Find cities within the specified radius
      const nearbyCities = allCities.filter((city) => {
        const distance = calculateDistance(majorCity.lat, majorCity.lng, city.lat, city.long);
        return distance <= SEARCH_RADIUS_KM;
      });

      if (nearbyCities.length === 0) {
        console.log(`    ✓ No nearby cities found`);
        continue;
      }

      // Calculate distance for each city and sort by distance (closest first)
      const citiesWithDistance = nearbyCities
        .map((city) => {
          const distance = calculateDistance(majorCity.lat, majorCity.lng, city.lat, city.long);
          return { city, distance };
        })
        .sort((a, b) => a.distance - b.distance);

      // Find the closest city with weather data
      let closestCityWithData = null;
      for (const { city, distance } of citiesWithDistance) {
        // Skip if the city already has the same name as the major city
        if (city.name === majorCity.city) {
          continue;
        }

        // Check if this city has weather data
        const hasWeatherData = city.weatherStations.length > 0 || city.weatherRecords.length > 0;

        if (hasWeatherData) {
          closestCityWithData = { city, distance };
          break;
        }
      }

      // If no city with weather data was found, skip
      if (!closestCityWithData) {
        console.log(`    ✓ No cities with weather data found nearby`);
        continue;
      }

      // Process only the closest city with weather data
      const smallCity = closestCityWithData.city;
      const stationCount = smallCity.weatherStations.length;
      const recordCount = smallCity.weatherRecords.length;

      // One-liner overview of the reassignment
      console.log(
        `    ✓ Reassigning: ${smallCity.name} → ${majorCity.city} (${closestCityWithData.distance.toFixed(2)}km, ${stationCount} stations, ${recordCount} records)`
      );

      // Instead of updating the small city, we'll reassign its weather stations and records to the major city
      if (!DRY_RUN) {
        try {
          // Step 1: Reassign weather stations to the major city
          if (stationCount > 0) {
            await prisma.weatherStation.updateMany({
              where: { cityId: smallCity.id },
              data: { cityId: dbMajorCity.id },
            });
          }

          // Step 2: Reassign weather records to the major city
          if (recordCount > 0) {
            await prisma.weatherRecord.updateMany({
              where: { cityId: smallCity.id },
              data: { cityId: dbMajorCity.id },
            });
          }

          // Step 3: Delete the small city (it's now empty)
          await prisma.city.delete({
            where: { id: smallCity.id },
          });
        } catch (error) {
          console.error(`    ✗ Error processing city ${smallCity.name}: ${error}`);
          // Continue with the next major city
        }
      }

      stats.smallCitiesReassigned++;
      stats.weatherStationsReassigned += stationCount;
      stats.weatherRecordsAffected += recordCount;

      // Show progress every 10 cities
      if (processedCount % 10 === 0 || processedCount === majorCitiesWithNearbyCities.size) {
        const percentage = ((processedCount / majorCitiesWithNearbyCities.size) * 100).toFixed(1);
        console.log(
          `\n  📈 Progress: ${processedCount}/${majorCitiesWithNearbyCities.size} major cities (${percentage}%)`
        );
        console.log(
          `     Cities reassigned so far: ${stats.smallCitiesReassigned.toLocaleString()}\n`
        );
      }
    }

    // Final summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 Reassignment Complete!');
    console.log('='.repeat(80));
    console.log(`\n✅ Major cities processed:      ${stats.majorCitiesFound.toLocaleString()}`);
    console.log(`✅ Small cities reassigned:     ${stats.smallCitiesReassigned.toLocaleString()}`);
    console.log(
      `🔄 Weather stations affected:   ${stats.weatherStationsReassigned.toLocaleString()}`
    );
    console.log(`🔄 Weather records affected:    ${stats.weatherRecordsAffected.toLocaleString()}`);

    // Verify final state
    const finalCityCount = await prisma.city.count();
    const finalStationCount = await prisma.weatherStation.count();
    const finalRecordCount = await prisma.weatherRecord.count();

    console.log(`\n🗄️  Database state comparison:`);
    console.log(`                      BEFORE      AFTER      CHANGE`);
    console.log(
      `  • Cities:           ${initialCityCount.toLocaleString().padEnd(11)} ${finalCityCount.toLocaleString().padEnd(11)} ${(finalCityCount - initialCityCount).toLocaleString()}`
    );
    console.log(
      `  • Weather stations: ${initialStationCount.toLocaleString().padEnd(11)} ${finalStationCount.toLocaleString().padEnd(11)} ${(finalStationCount - initialStationCount).toLocaleString()}`
    );
    console.log(
      `  • Weather records:  ${initialRecordCount.toLocaleString().padEnd(11)} ${finalRecordCount.toLocaleString().padEnd(11)} ${(finalRecordCount - initialRecordCount).toLocaleString()}`
    );
    console.log(`\n${'='.repeat(80)}`);
  } catch (error) {
    console.error('❌ Error during reassignment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  console.log('\n⚠️  WARNING: This script will modify your database!');
  console.log(
    `It will reassign small cities within ${SEARCH_RADIUS_KM}km of major cities (population >= ${MIN_MAJOR_CITY_POPULATION.toLocaleString()}).`
  );

  if (!DRY_RUN) {
    console.log('Make sure you have a backup before proceeding.\n');
  }

  console.log('\nUsage:');
  console.log('  cd server && npx tsx scripts/reassign-cities-to-major-cities.ts');
  console.log('  cd server && npx tsx scripts/reassign-cities-to-major-cities.ts --dry-run');
  console.log('  cd server && npx tsx scripts/reassign-cities-to-major-cities.ts --limit=5');
  console.log(
    '  cd server && npx tsx scripts/reassign-cities-to-major-cities.ts --dry-run --limit=5\n'
  );

  await reassignCitiesToMajorCities();
}

main().catch((error) => {
  console.error('💥 Reassignment failed:', error);
  process.exit(1);
});
