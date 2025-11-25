/**
 * csv data import script for vaycay weather database
 *
 * this script imports historical weather data from batch csv files into the postgres database.
 * it processes data from multiple batch directories (batch1, batch2, etc.) located in
 * dataAndUtils/worldData_v2/, where each batch contains a csv file with weather records.
 *
 * the import process runs in 4 phases:
 *
 * 1. collection phase: scans all batch csv files to identify unique cities and weather stations
 *    - deduplicates cities based on name, country, and coordinates
 *    - tracks unique weather stations per city
 *
 * 2. city insertion: creates city records in the database
 *    - includes geographic data (lat/long), population, and metadata
 *    - processes in batches of 1000 for efficiency
 *    - maintains a map of city keys to database ids for later phases
 *
 * 3. station insertion: creates weather station records linked to cities
 *    - each station is associated with a specific city
 *    - processes in batches of 1000
 *    - maintains a map of station keys to database ids
 *
 * 4. weather record insertion: imports all weather measurements
 *    - includes temperature (tavg, tmax, tmin), precipitation (prcp), snow depth (snwd),
 *      wind data (awnd, wdf2, wdf5, wsf2, wsf5), and other metrics
 *    - processes in batches of 5000 for optimal performance
 *    - uses skipDuplicates to handle any duplicate records
 *
 * csv format:
 * each csv file contains columns for city metadata (name, country, state, lat, long),
 * weather station info (name), date, and various weather metrics (temperature, precipitation,
 * wind, etc.). the script handles quoted fields and empty values appropriately.
 *
 * performance considerations:
 * - uses batch inserts to minimize database round-trips
 * - deduplicates data in memory before insertion to avoid constraint violations
 * - provides progress updates during long-running operations
 * - verifies final counts against database after import
 *
 * usage:
 * npm run import-csv-data
 *
 * the script expects batch directories to be located at:
 * ../dataAndUtils/worldData_v2/batch1/, batch2/, etc.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const prisma = new PrismaClient();

interface CSVRow {
  city: string;
  country: string;
  state?: string;
  suburb?: string;
  lat: string;
  long: string;
  date: string;
  name: string; // weather station name
  city_ascii?: string;
  iso2?: string;
  iso3?: string;
  capital?: string;
  worldcities_id?: string;
  data_source?: string;
  population?: string;
  // weather metrics
  AWND?: string;
  DAPR?: string;
  DATN?: string;
  DATX?: string;
  DWPR?: string;
  MDPR?: string;
  MDTN?: string;
  MDTX?: string;
  PRCP?: string;
  SNWD?: string;
  TAVG?: string;
  TMAX?: string;
  TMIN?: string;
  WDF2?: string;
  WDF5?: string;
  WSF2?: string;
  WSF5?: string;
}

interface ImportStats {
  totalRecords: number;
  citiesCreated: number;
  stationsCreated: number;
  weatherRecordsCreated: number;
  errors: number;
  skipped: number;
}

interface CityKey {
  name: string;
  country: string;
  lat: number;
  long: number;
  coordSum?: {
    lat: number;
    long: number;
    count: number;
  };
}

// helper to parse csv line respecting quoted fields
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

// helper to parse float or return null
function parseFloat(value: string | undefined): number | null {
  if (!value || value === '') return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

// helper to create city key for deduplication
function createCityKey(row: CSVRow): string {
  // CRITICAL: For cities from worldcities.csv (major cities with worldcities_id),
  // use ONLY name|country|state to group ALL weather stations together.
  // This ensures Rome's 366 records with varying coordinates become ONE city.
  //
  // For cities NOT in worldcities (small towns), add rounded coordinates
  // to distinguish between different places with the same name (e.g., multiple "Jackson"s).
  const state = row.state || '';
  const hasWorldcitiesId =
    row.worldcities_id && row.worldcities_id !== '' && row.worldcities_id !== 'null';

  if (hasWorldcitiesId) {
    // Major city from worldcities - group all weather data regardless of coordinates
    return `${row.city}|${row.country}|${state}`;
  }

  // Small city not in worldcities - add coordinates to distinguish
  const lat = parseFloat(row.lat) || 0;
  const long = parseFloat(row.long) || 0;
  return `${row.city}|${row.country}|${state}|${lat.toFixed(1)}|${long.toFixed(1)}`;
}

async function importCSVData(batchDir: string) {
  console.log('🌍 Vaycay CSV Data Import Tool');
  console.log('='.repeat(80));
  console.log(`📂 Batch directory: ${batchDir}`);
  console.log('='.repeat(80));

  const stats: ImportStats = {
    totalRecords: 0,
    citiesCreated: 0,
    stationsCreated: 0,
    weatherRecordsCreated: 0,
    errors: 0,
    skipped: 0,
  };

  try {
    // find all batch directories
    const batchDirs = readdirSync(batchDir)
      .filter((name) => name.startsWith('batch'))
      .sort((a, b) => {
        const numA = Number.parseInt(a.replace('batch', ''), 10);
        const numB = Number.parseInt(b.replace('batch', ''), 10);
        return numA - numB;
      });

    console.log(`\n📦 Found ${batchDirs.length} batch directories\n`);

    // phase 1: collect all unique cities and stations
    console.log('📊 Phase 1: Collecting unique cities and stations...\n');

    const cityMap = new Map<string, CityKey & { data: CSVRow }>();
    const stationMap = new Map<string, { name: string; cityKey: string }>();

    for (const batchName of batchDirs) {
      const csvPath = join(batchDir, batchName, `${batchName}_weather_data.csv`);

      try {
        const content = readFileSync(csvPath, 'utf-8');
        const lines = content.split('\n');
        const headers = parseCSVLine(lines[0]);

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = parseCSVLine(line);
          const row: CSVRow = {} as CSVRow;

          headers.forEach((header, index) => {
            row[header as keyof CSVRow] = values[index];
          });

          // collect unique cities and accumulate coordinates for averaging
          const cityKey = createCityKey(row);
          const lat = parseFloat(row.lat) || 0;
          const long = parseFloat(row.long) || 0;

          if (!cityMap.has(cityKey)) {
            cityMap.set(cityKey, {
              name: row.city,
              country: row.country,
              lat,
              long,
              data: row,
              coordSum: { lat, long, count: 1 }, // Track for averaging
            });
          } else {
            // Accumulate coordinates for averaging
            const existing = cityMap.get(cityKey)!;
            if (existing.coordSum) {
              existing.coordSum.lat += lat;
              existing.coordSum.long += long;
              existing.coordSum.count++;
            }
          }

          // collect unique stations (will link to cities later)
          // Generate station name if not present in CSV (v2 data doesn't have station names)
          const stationName = row.name || `${row.city} Weather Station`;
          const stationKey = `${stationName}|${cityKey}`;
          if (!stationMap.has(stationKey)) {
            stationMap.set(stationKey, {
              name: stationName,
              cityKey,
            });
          }

          stats.totalRecords++;
        }

        console.log(`  ✓ Processed ${batchName}: ${lines.length - 1} records`);
      } catch (error) {
        console.error(`  ✗ Error reading ${batchName}:`, error);
        stats.errors++;
      }
    }

    console.log(`\n📈 Collection complete:`);
    console.log(`  • Total records: ${stats.totalRecords.toLocaleString()}`);
    console.log(`  • Unique cities: ${cityMap.size.toLocaleString()}`);
    console.log(`  • Unique stations: ${stationMap.size.toLocaleString()}`);

    // Write diagnostic file for major cities
    const diagnosticCities = [
      'Rome|Italy|Lazio',
      'London|United Kingdom|England',
      'Tokyo|Japan|',
      'Paris|France|Île-de-France',
    ];
    const diagnosticData: any = {
      timestamp: new Date().toISOString(),
      phase: 'collection',
      cities: {},
    };

    for (const cityKey of diagnosticCities) {
      if (cityMap.has(cityKey)) {
        const cityInfo = cityMap.get(cityKey)!;
        diagnosticData.cities[cityKey] = {
          coordSum: cityInfo.coordSum,
          avgLat: cityInfo.coordSum
            ? cityInfo.coordSum.lat / cityInfo.coordSum.count
            : cityInfo.lat,
          avgLong: cityInfo.coordSum
            ? cityInfo.coordSum.long / cityInfo.coordSum.count
            : cityInfo.long,
          worldcitiesId: cityInfo.data.worldcities_id,
        };
      }
    }

    writeFileSync(
      join(process.cwd(), 'import-diagnostic-collection.json'),
      JSON.stringify(diagnosticData, null, 2)
    );
    console.log(`  📝 Wrote diagnostic data to import-diagnostic-collection.json`);

    // phase 2: insert cities
    console.log('\n📊 Phase 2: Inserting cities...\n');

    const cityIdMap = new Map<string, number>();
    const cityBatchSize = 1000;
    const cityEntries = Array.from(cityMap.entries());

    for (let i = 0; i < cityEntries.length; i += cityBatchSize) {
      const batch = cityEntries.slice(i, i + cityBatchSize);

      // insert cities and get their ids (upsert to handle existing cities)
      for (const [cityKey, cityInfo] of batch) {
        try {
          // Use averaged coordinates if we accumulated multiple coordinate pairs
          const avgLat = cityInfo.coordSum
            ? cityInfo.coordSum.lat / cityInfo.coordSum.count
            : cityInfo.lat;
          const avgLong = cityInfo.coordSum
            ? cityInfo.coordSum.long / cityInfo.coordSum.count
            : cityInfo.long;

          const cityData = {
            name: cityInfo.name,
            country: cityInfo.country,
            state: cityInfo.data.state || null,
            suburb: cityInfo.data.suburb || null,
            lat: avgLat,
            long: avgLong,
            cityAscii: cityInfo.data.city_ascii || null,
            iso2: cityInfo.data.iso2 || null,
            iso3: cityInfo.data.iso3 || null,
            capital: cityInfo.data.capital || null,
            worldcitiesId: parseFloat(cityInfo.data.worldcities_id),
            population: parseFloat(cityInfo.data.population),
            dataSource: cityInfo.data.data_source || null,
          };

          // Standard upsert based on unique constraint (name, country, lat, long)
          // This handles both new cities and updates to existing ones
          // The reassign-cities-to-major-cities script will later:
          // 1. Merge duplicates (multiple entries with same name/country)
          // 2. Update coordinates to match worldcities.csv official values
          // 3. Update populations from worldcities.csv
          const city = await prisma.city.upsert({
            where: {
              name_country_lat_long: {
                name: cityInfo.name,
                country: cityInfo.country,
                lat: avgLat,
                long: avgLong,
              },
            },
            create: cityData,
            update: cityData,
          });

          cityIdMap.set(cityKey, city.id);
          stats.citiesCreated++;
        } catch (error) {
          console.error(
            `  ✗ Error inserting city ${cityInfo.name}, ${cityInfo.country}:`,
            error instanceof Error ? error.message : error
          );
          stats.errors++;
        }
      }

      const progress = ((i + batch.length) / cityEntries.length) * 100;
      console.log(
        `  ✓ Processed ${stats.citiesCreated.toLocaleString()} cities (${progress.toFixed(1)}%)`
      );
    }

    console.log(`\n✅ Cities inserted: ${stats.citiesCreated.toLocaleString()}`);

    // Write diagnostic file after city insertion
    const cityDiagnostic: any = {
      timestamp: new Date().toISOString(),
      phase: 'city_insertion',
      cities: {},
      cityIdMap: Object.fromEntries(
        Array.from(cityIdMap.entries()).filter(([key]) => diagnosticCities.includes(key))
      ),
    };

    for (const cityKey of diagnosticCities) {
      const cityId = cityIdMap.get(cityKey);
      if (cityId) {
        cityDiagnostic.cities[cityKey] = { cityId, found: true };
      } else {
        cityDiagnostic.cities[cityKey] = { cityId: null, found: false };
      }
    }

    writeFileSync(
      join(process.cwd(), 'import-diagnostic-cities.json'),
      JSON.stringify(cityDiagnostic, null, 2)
    );
    console.log(`  📝 Wrote city diagnostic data to import-diagnostic-cities.json`);

    // phase 3: insert weather stations
    console.log('\n📊 Phase 3: Inserting weather stations...\n');

    const stationIdMap = new Map<string, number>();
    const stationBatchSize = 1000;
    const stationEntries = Array.from(stationMap.entries());

    for (let i = 0; i < stationEntries.length; i += stationBatchSize) {
      const batch = stationEntries.slice(i, i + stationBatchSize);

      try {
        for (const [stationKey, station] of batch) {
          const cityId = cityIdMap.get(station.cityKey);
          if (!cityId) {
            console.warn(`  ⚠ City not found for station: ${station.name}`);
            stats.skipped++;
            continue;
          }

          const weatherStation = await prisma.weatherStation.upsert({
            where: {
              name_cityId: {
                name: station.name,
                cityId,
              },
            },
            create: {
              name: station.name,
              cityId,
            },
            update: {}, // Don't update existing stations
          });

          stationIdMap.set(stationKey, weatherStation.id);
          stats.stationsCreated++;
        }

        const progress = ((i + batch.length) / stationEntries.length) * 100;
        console.log(
          `  ✓ Inserted ${stats.stationsCreated.toLocaleString()} stations (${progress.toFixed(1)}%)`
        );
      } catch (error) {
        console.error(`  ✗ Error inserting station batch:`, error);
        stats.errors += batch.length;
      }
    }

    console.log(`\n✅ Stations inserted: ${stats.stationsCreated.toLocaleString()}`);

    // phase 4: insert weather records
    console.log('\n📊 Phase 4: Inserting weather records...\n');

    const recordBatchSize = 5000;
    let recordsProcessed = 0;

    for (const batchName of batchDirs) {
      const csvPath = join(batchDir, batchName, `${batchName}_weather_data.csv`);

      try {
        const content = readFileSync(csvPath, 'utf-8');
        const lines = content.split('\n');
        const headers = parseCSVLine(lines[0]);

        const recordsToInsert: Array<{
          cityId: number;
          stationId: number;
          date: string;
          PRCP: number | null;
          SNWD: number | null;
          TAVG: number | null;
          TMAX: number | null;
          TMIN: number | null;
          AWND: number | null;
          DAPR: number | null;
          DATN: number | null;
          DATX: number | null;
          DWPR: number | null;
          MDPR: number | null;
          MDTN: number | null;
          MDTX: number | null;
          WDF2: number | null;
          WDF5: number | null;
          WSF2: number | null;
          WSF5: number | null;
        }> = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = parseCSVLine(line);
          const row: CSVRow = {} as CSVRow;

          headers.forEach((header, index) => {
            row[header as keyof CSVRow] = values[index];
          });

          const cityKey = createCityKey(row);
          // Use same station name logic as collection phase
          const stationName = row.name || `${row.city} Weather Station`;
          const stationKey = `${stationName}|${cityKey}`;

          const cityId = cityIdMap.get(cityKey);
          const stationId = stationIdMap.get(stationKey);

          if (!cityId || !stationId) {
            stats.skipped++;
            continue;
          }

          recordsToInsert.push({
            cityId,
            stationId,
            date: row.date,
            PRCP: parseFloat(row.PRCP),
            SNWD: parseFloat(row.SNWD),
            TAVG: parseFloat(row.TAVG),
            TMAX: parseFloat(row.TMAX),
            TMIN: parseFloat(row.TMIN),
            AWND: parseFloat(row.AWND),
            DAPR: parseFloat(row.DAPR),
            DATN: parseFloat(row.DATN),
            DATX: parseFloat(row.DATX),
            DWPR: parseFloat(row.DWPR),
            MDPR: parseFloat(row.MDPR),
            MDTN: parseFloat(row.MDTN),
            MDTX: parseFloat(row.MDTX),
            WDF2: parseFloat(row.WDF2),
            WDF5: parseFloat(row.WDF5),
            WSF2: parseFloat(row.WSF2),
            WSF5: parseFloat(row.WSF5),
          });

          // insert in batches
          if (recordsToInsert.length >= recordBatchSize) {
            const result = await prisma.weatherRecord.createMany({
              data: recordsToInsert,
              skipDuplicates: true,
            });

            stats.weatherRecordsCreated += result.count;
            recordsProcessed += recordsToInsert.length;
            recordsToInsert.length = 0;

            if (recordsProcessed % 100000 === 0) {
              const progress = (recordsProcessed / stats.totalRecords) * 100;
              console.log(
                `  ✓ Inserted ${stats.weatherRecordsCreated.toLocaleString()} records (${progress.toFixed(1)}%)`
              );
            }
          }
        }

        // insert remaining records
        if (recordsToInsert.length > 0) {
          const result = await prisma.weatherRecord.createMany({
            data: recordsToInsert,
            skipDuplicates: true,
          });

          stats.weatherRecordsCreated += result.count;
          recordsProcessed += recordsToInsert.length;
        }

        console.log(`  ✓ Completed ${batchName}`);
      } catch (error) {
        console.error(`  ✗ Error processing ${batchName}:`, error);
        stats.errors++;
      }
    }

    // Write final diagnostic with sample record counts for major cities
    console.log('\n📝 Writing final diagnostics...');
    const finalDiagnostic: any = {
      timestamp: new Date().toISOString(),
      phase: 'final',
      stats,
      majorCities: {},
    };

    for (const cityKey of diagnosticCities) {
      const cityId = cityIdMap.get(cityKey);
      if (cityId) {
        const recordCount = await prisma.weatherRecord.count({
          where: { cityId },
        });
        finalDiagnostic.majorCities[cityKey] = {
          cityId,
          recordCount,
        };
      } else {
        finalDiagnostic.majorCities[cityKey] = {
          cityId: null,
          recordCount: 0,
          error: 'City not found in cityIdMap',
        };
      }
    }

    writeFileSync(
      join(process.cwd(), 'import-diagnostic-final.json'),
      JSON.stringify(finalDiagnostic, null, 2)
    );

    // final statistics
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 Import Complete!');
    console.log('='.repeat(80));
    console.log(`Total CSV records:        ${stats.totalRecords.toLocaleString()}`);
    console.log(`✅ Cities created:        ${stats.citiesCreated.toLocaleString()}`);
    console.log(`✅ Stations created:      ${stats.stationsCreated.toLocaleString()}`);
    console.log(`✅ Weather records:       ${stats.weatherRecordsCreated.toLocaleString()}`);
    console.log(`⏭️  Skipped:               ${stats.skipped.toLocaleString()}`);
    console.log(`❌ Errors:                ${stats.errors.toLocaleString()}`);
    console.log('='.repeat(80));
    console.log(`\n📝 Diagnostic files written:`);
    console.log(`   • import-diagnostic-collection.json`);
    console.log(`   • import-diagnostic-cities.json`);
    console.log(`   • import-diagnostic-final.json`);

    // verify import
    const cityCount = await prisma.city.count();
    const stationCount = await prisma.weatherStation.count();
    const recordCount = await prisma.weatherRecord.count();

    console.log(`\n🗄️  Database verification:`);
    console.log(`  • Cities:          ${cityCount.toLocaleString()}`);
    console.log(`  • Stations:        ${stationCount.toLocaleString()}`);
    console.log(`  • Weather records: ${recordCount.toLocaleString()}`);
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// main execution
async function main() {
  const batchDir = resolve(process.cwd(), '..', 'dataAndUtils', 'worldData_v2');

  console.log(`📍 Batch directory: ${batchDir}\n`);

  await importCSVData(batchDir);
}

main().catch((error) => {
  console.error('💥 Import failed:', error);
  process.exit(1);
});
