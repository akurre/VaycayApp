import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Define a type for city where clauses
interface CityWhereClause {
  name: string;
  country: string;
  state?: string;
}

const prisma = new PrismaClient();

// Country name mapping to handle variations
const countryMapping: Record<string, string> = {
  'South Korea': 'Korea, South',
  Taiwan: 'Taiwan',
  'United States': 'United States',
  'United Kingdom': 'United Kingdom',
  'Czech Republic': 'Czechia',
  Russia: 'Russian Federation',
  "Côte d'Ivoire": 'Ivory Coast',
  'Democratic Republic of the Congo': 'Congo, Democratic Republic of the',
  Congo: 'Congo, Republic of the',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'North Macedonia': 'Macedonia',
  'Saint Pierre and Miquelon': 'Saint Pierre & Miquelon',
  'Falkland Islands': 'Falkland Islands (Islas Malvinas)',
  // Add more mappings as needed
};

// City name normalization function
function normalizeCity(city: string): string {
  // Replace accented characters
  const normalized = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Handle common variations
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ä/g, 'a')
    .replace(/é/g, 'e')
    .replace(/è/g, 'e')
    .replace(/ñ/g, 'n');

  // Handle specific city name variations
  const cityMapping: Record<string, string> = {
    Zurich: 'Zürich',
    Seville: 'Sevilla',
    'Washington D.C.': 'Washington',
    Taipei: 'Taipei City',
    Kaohsiung: 'Kaohsiung City',
    Taichung: 'Taichung City',
    Brasília: 'Brasilia',
    Yaoundé: 'Yaounde',
    "N'Djamena": 'Ndjamena',
    Reykjavik: 'Reykjavík',
    'Tel Aviv': 'Tel Aviv-Yafo',
    'Luxembourg City': 'Luxembourg',
    Valletta: 'Valletta',
    'Dar-es-Salaam': 'Dar es Salaam',
    // Add more mappings as needed
  };

  return cityMapping[city] || normalized;
}

interface SunshineRow {
  Country: string;
  City: string;
  State: string;
  Jan: string;
  Feb: string;
  Mar: string;
  Apr: string;
  May: string;
  Jun: string;
  Jul: string;
  Aug: string;
  Sep: string;
  Oct: string;
  Nov: string;
  Dec: string;
  Year: string;
}

interface ImportStats {
  totalRecords: number;
  successfulImports: number;
  citiesNotFound: number;
  errors: number;
  matchingApproaches: {
    exactMatch: number;
    countryNormalized: number;
    cityNormalized: number;
    bothNormalized: number;
  };
}

// helper to parse float or return null
function parseFloat(value: string | undefined): number | null {
  if (!value || value === '') return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
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

async function importSunshineHours(csvPath: string) {
  console.log('☀️  Vaycay Sunshine Hours Import Tool');
  console.log('='.repeat(80));
  console.log(`📂 CSV file: ${csvPath}`);
  console.log('='.repeat(80));

  const stats: ImportStats = {
    totalRecords: 0,
    successfulImports: 0,
    citiesNotFound: 0,
    errors: 0,
    matchingApproaches: {
      exactMatch: 0,
      countryNormalized: 0,
      cityNormalized: 0,
      bothNormalized: 0,
    },
  };

  try {
    const content = readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');
    const headers = parseCSVLine(lines[0]);

    console.log(`\n📊 Processing ${lines.length - 1} records...\n`);

    const recordsToInsert: Array<{
      cityId: number;
      jan: number | null;
      feb: number | null;
      mar: number | null;
      apr: number | null;
      may: number | null;
      jun: number | null;
      jul: number | null;
      aug: number | null;
      sep: number | null;
      oct: number | null;
      nov: number | null;
      dec: number | null;
      annual: number | null;
    }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      const row: SunshineRow = {} as SunshineRow;

      headers.forEach((header, index) => {
        row[header as keyof SunshineRow] = values[index];
      });

      stats.totalRecords++;

      try {
        // Try multiple approaches to find the city
        let city = null;

        // Approach 1: Exact match (original approach)
        const whereClauseExact: CityWhereClause = {
          name: row.City,
          country: row.Country,
        };

        // Add state to the query if it exists
        if (row.State && row.State.trim() !== '') {
          whereClauseExact.state = row.State;
        }

        city = await prisma.city.findFirst({
          where: whereClauseExact,
        });

        if (city) {
          stats.matchingApproaches.exactMatch++;
        } else {
          // Approach 2: Try with normalized country name
          const normalizedCountry = countryMapping[row.Country] || row.Country;
          if (normalizedCountry !== row.Country) {
            const whereClauseNormalizedCountry: CityWhereClause = {
              name: row.City,
              country: normalizedCountry,
            };

            if (row.State && row.State.trim() !== '') {
              whereClauseNormalizedCountry.state = row.State;
            }

            city = await prisma.city.findFirst({
              where: whereClauseNormalizedCountry,
            });

            if (city) {
              stats.matchingApproaches.countryNormalized++;
            }
          }

          // Approach 3: Try with normalized city name
          if (!city) {
            const normalizedCity = normalizeCity(row.City);
            if (normalizedCity !== row.City) {
              const whereClauseNormalizedCity: CityWhereClause = {
                name: normalizedCity,
                country: row.Country,
              };

              if (row.State && row.State.trim() !== '') {
                whereClauseNormalizedCity.state = row.State;
              }

              city = await prisma.city.findFirst({
                where: whereClauseNormalizedCity,
              });

              if (city) {
                stats.matchingApproaches.cityNormalized++;
              } else if (normalizedCountry !== row.Country) {
                // Approach 4: Try with both normalized country and city
                const whereClauseBothNormalized: CityWhereClause = {
                  name: normalizedCity,
                  country: normalizedCountry,
                };

                if (row.State && row.State.trim() !== '') {
                  whereClauseBothNormalized.state = row.State;
                }

                city = await prisma.city.findFirst({
                  where: whereClauseBothNormalized,
                });

                if (city) {
                  stats.matchingApproaches.bothNormalized++;
                }
              }
            }
          }
        }

        if (!city) {
          console.warn(
            `  ⚠ City not found: ${row.City}, ${row.Country}${row.State ? `, ${row.State}` : ''}`
          );
          stats.citiesNotFound++;
          continue;
        }

        recordsToInsert.push({
          cityId: city.id,
          jan: parseFloat(row.Jan),
          feb: parseFloat(row.Feb),
          mar: parseFloat(row.Mar),
          apr: parseFloat(row.Apr),
          may: parseFloat(row.May),
          jun: parseFloat(row.Jun),
          jul: parseFloat(row.Jul),
          aug: parseFloat(row.Aug),
          sep: parseFloat(row.Sep),
          oct: parseFloat(row.Oct),
          nov: parseFloat(row.Nov),
          dec: parseFloat(row.Dec),
          annual: parseFloat(row.Year),
        });

        if (recordsToInsert.length >= 100) {
          const result = await prisma.monthlySunshine.createMany({
            data: recordsToInsert,
            skipDuplicates: true,
          });

          stats.successfulImports += result.count;
          recordsToInsert.length = 0;

          const progress = (i / (lines.length - 1)) * 100;
          console.log(`  ✓ Imported ${stats.successfulImports} records (${progress.toFixed(1)}%)`);
        }
      } catch (error) {
        console.error(`  ✗ Error processing row ${i}:`, error);
        stats.errors++;
      }
    }

    // insert remaining records
    if (recordsToInsert.length > 0) {
      const result = await prisma.monthlySunshine.createMany({
        data: recordsToInsert,
        skipDuplicates: true,
      });

      stats.successfulImports += result.count;
    }

    // final statistics
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 Import Complete!');
    console.log('='.repeat(80));
    console.log(`Total CSV records:        ${stats.totalRecords.toLocaleString()}`);
    console.log(`✅ Successful imports:    ${stats.successfulImports.toLocaleString()}`);
    console.log(`⚠️  Cities not found:      ${stats.citiesNotFound.toLocaleString()}`);
    console.log(`❌ Errors:                ${stats.errors.toLocaleString()}`);
    console.log(`\n📊 Matching approaches used:`);
    console.log(
      `  • Exact match:           ${stats.matchingApproaches.exactMatch.toLocaleString()}`
    );
    console.log(
      `  • Country normalized:    ${stats.matchingApproaches.countryNormalized.toLocaleString()}`
    );
    console.log(
      `  • City normalized:       ${stats.matchingApproaches.cityNormalized.toLocaleString()}`
    );
    console.log(
      `  • Both normalized:       ${stats.matchingApproaches.bothNormalized.toLocaleString()}`
    );
    console.log('='.repeat(80));

    // verify import
    const sunshineCount = await prisma.monthlySunshine.count();

    console.log(`\n🗄️  Database verification:`);
    console.log(`  • Monthly sunshine records: ${sunshineCount.toLocaleString()}`);
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// main execution
async function main() {
  const csvPath = resolve(
    process.cwd(),
    '..',
    'dataAndUtils',
    'legacy',
    'weather_data',
    'Sunshine_hours_world_cities.csv'
  );

  console.log(`📍 CSV file path: ${csvPath}\n`);

  await importSunshineHours(csvPath);
}

main().catch((error) => {
  console.error('💥 Import failed:', error);
  process.exit(1);
});
