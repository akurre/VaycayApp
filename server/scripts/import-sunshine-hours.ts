import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const prisma = new PrismaClient();

interface SunshineRow {
  Country: string;
  City: string;
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
        // find city by name and country
        const city = await prisma.city.findFirst({
          where: {
            name: row.City,
            country: row.Country,
          },
        });

        if (!city) {
          console.warn(
            `  ⚠ City not found: ${row.City}, ${row.Country}`
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
          console.log(
            `  ✓ Imported ${stats.successfulImports} records (${progress.toFixed(1)}%)`
          );
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
    'Sunshine hours for cities in the world.csv'
  );

  console.log(`📍 CSV file path: ${csvPath}\n`);

  await importSunshineHours(csvPath);
}

main().catch((error) => {
  console.error('💥 Import failed:', error);
  process.exit(1);
});
