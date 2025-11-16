import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync } from 'node:fs';
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

// mapping of CSV country names to database country names
const countryMapping: Record<string, string> = {
  'Ivory Coast': 'Côte d\'Ivoire',
  'United ArabEmirates': 'United Arab Emirates',
  'Saint Pierreand Miquelon': 'Saint Pierre and Miquelon',
};

// mapping of specific city/country combinations
const cityMapping: Record<string, Record<string, string>> = {
  'Côte d\'Ivoire': {
    'Gagnoa': 'Gagnoa',
    'Bouaké': 'Bouaké',
    'Abidjan': 'Abidjan',
  },
  'Egypt': {
    'Cairo': 'Cairo',
    'Hurghada': 'Hurghada',
  },
  'Ethiopia': {
    'Addis Abeba': 'Addis Ababa',
  },
  'United States': {
    'New York City': 'New York',
    'OklahomaCity': 'Oklahoma City',
    'Washington,D.C.': 'Washington',
  },
  'Brazil': {
    'Brasília': 'Brasília',
  },
};

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

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

async function fixSunshineCSV() {
  console.log('🔧 Fixing Sunshine Hours CSV\n');

  const csvPath = resolve(
    process.cwd(),
    '..',
    'dataAndUtils',
    'legacy',
    'weather_data',
    'Sunshine hours for cities in the world.csv'
  );

  const content = readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);

  const fixedLines: string[] = [lines[0]]; // keep header
  let fixedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row: SunshineRow = {} as SunshineRow;

    headers.forEach((header, index) => {
      row[header as keyof SunshineRow] = values[index];
    });

    let country = row.Country;
    let city = row.City;

    // apply country mapping
    if (countryMapping[country]) {
      country = countryMapping[country];
      console.log(`  ✓ Fixed country: "${row.Country}" → "${country}"`);
      fixedCount++;
    }

    // apply city mapping
    if (cityMapping[country] && cityMapping[country][city]) {
      const newCity = cityMapping[country][city];
      if (newCity !== city) {
        console.log(`  ✓ Fixed city: "${city}" → "${newCity}" in ${country}`);
        city = newCity;
        fixedCount++;
      }
    }

    // rebuild CSV line
    const fixedRow = [
      escapeCSVField(country),
      escapeCSVField(city),
      row.Jan,
      row.Feb,
      row.Mar,
      row.Apr,
      row.May,
      row.Jun,
      row.Jul,
      row.Aug,
      row.Sep,
      row.Oct,
      row.Nov,
      row.Dec,
      row.Year,
    ];

    fixedLines.push(fixedRow.join(','));
  }

  // write fixed CSV
  writeFileSync(csvPath, fixedLines.join('\n'));
  console.log(`\n✅ Fixed CSV written to ${csvPath}`);
  console.log(`   Total fixes applied: ${fixedCount}`);

  await prisma.$disconnect();
}

fixSunshineCSV().catch(console.error);
