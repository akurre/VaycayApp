import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reusable script to manually add sunshine data for any city
 *
 * Features:
 * - Can be run multiple times safely (uses upsert - will update existing data)
 * - Validates that the city exists in the database before adding data
 * - Shows helpful error messages with similar city suggestions if city not found
 * - Automatically calculates annual total from monthly values
 *
 * Usage:
 * 1. Edit the CITIES_TO_ADD array below with your city data
 * 2. Run: make add-birmingham-sunshine (or adjust the make command name)
 * 3. Or run directly: DATABASE_URL="..." npx tsx scripts/add-birmingham-sunshine.ts
 */

// ============================================================================
// 📝 EDIT THIS SECTION TO ADD YOUR CITY DATA
// ============================================================================

interface CityData {
  name: string;
  state: string | null;
  country: string;
  sunshineHours: {
    jan: number;
    feb: number;
    mar: number;
    apr: number;
    may: number;
    jun: number;
    jul: number;
    aug: number;
    sep: number;
    oct: number;
    nov: number;
    dec: number;
  };
}

const CITIES_TO_ADD: CityData[] = [
  {
    name: 'Birmingham',
    state: 'Alabama',
    country: 'United States',
    sunshineHours: {
      jan: 148,
      feb: 160,
      mar: 220,
      apr: 248,
      may: 283,
      jun: 281,
      jul: 265,
      aug: 261,
      sep: 224,
      oct: 232,
      nov: 167,
      dec: 155,
    },
  },
  {
    name: 'San Jose',
    state: 'California',
    country: 'United States',
    sunshineHours: {
      jan: 186,
      feb: 209,
      mar: 270,
      apr: 310,
      may: 324,
      jun: 312,
      jul: 313,
      aug: 288,
      sep: 270,
      oct: 243,
      nov: 173,
      dec: 160,
    },
  },
  // Add more cities here:
  // {
  //   name: 'Seattle',
  //   state: 'Washington',
  //   country: 'United States',
  //   sunshineHours: {
  //     jan: 69, feb: 108, mar: 178, apr: 207,
  //     may: 253, jun: 268, jul: 312, aug: 281,
  //     sep: 221, oct: 142, nov: 72, dec: 52,
  //   },
  // },
];

// ============================================================================

async function addManuallySunshineData(
  cityName: string,
  stateName: string | null,
  countryName: string,
  monthlyHours: {
    jan: number;
    feb: number;
    mar: number;
    apr: number;
    may: number;
    jun: number;
    jul: number;
    aug: number;
    sep: number;
    oct: number;
    nov: number;
    dec: number;
  }
) {
  console.log(
    `☀️  Adding Sunshine Data for ${cityName}${stateName ? `, ${stateName}` : ''}, ${countryName}`
  );
  console.log('='.repeat(80));

  try {
    // Step 1: Find the city in the database
    console.log(
      `\n🔍 Looking for ${cityName}${stateName ? `, ${stateName}` : ''}, ${countryName} in database...`
    );

    const whereClause: {
      name: string;
      country: string;
      state?: string;
    } = {
      name: cityName,
      country: countryName,
    };

    if (stateName) {
      whereClause.state = stateName;
    }

    const city = await prisma.city.findFirst({
      where: whereClause,
    });

    if (!city) {
      console.error(
        `❌ City not found: ${cityName}${stateName ? `, ${stateName}` : ''}, ${countryName}`
      );
      console.log('\n💡 Tips:');
      console.log('   - Check if the city exists in the database');
      console.log('   - Verify the exact name, state, and country format');
      console.log('   - Try searching for similar cities:\n');

      // Try to find similar cities
      const searchConditions = [{ name: { contains: cityName } }];

      if (stateName) {
        searchConditions.push({
          AND: [{ state: stateName }, { country: countryName }],
        } as any);
      } else {
        searchConditions.push({ country: countryName } as any);
      }

      const similarCities = await prisma.city.findMany({
        where: {
          OR: searchConditions,
        },
        take: 10,
      });

      if (similarCities.length > 0) {
        console.log('   Found these similar cities:');
        for (const c of similarCities) {
          console.log(
            `     - ${c.name}${c.state ? `, ${c.state}` : ''}, ${c.country} (ID: ${c.id})`
          );
        }
      }

      return;
    }

    console.log(
      `✅ Found city: ${city.name}${city.state ? `, ${city.state}` : ''}, ${city.country} (ID: ${city.id})`
    );
    console.log(`   Coordinates: (${city.lat}, ${city.long})`);

    // Step 2: Check if sunshine data already exists
    const existingSunshine = await prisma.monthlySunshine.findUnique({
      where: { cityId: city.id },
    });

    if (existingSunshine) {
      console.log('\n⚠️  Sunshine data already exists for this city');
      console.log('   Will update with new values...');
    } else {
      console.log('\n📝 No existing sunshine data found');
      console.log('   Will create new record...');
    }

    // Step 3: Calculate annual total
    const annual =
      monthlyHours.jan +
      monthlyHours.feb +
      monthlyHours.mar +
      monthlyHours.apr +
      monthlyHours.may +
      monthlyHours.jun +
      monthlyHours.jul +
      monthlyHours.aug +
      monthlyHours.sep +
      monthlyHours.oct +
      monthlyHours.nov +
      monthlyHours.dec;

    const sunshineData = {
      ...monthlyHours,
      annual,
    };

    console.log('\n☀️  Sunshine hours by month:');
    console.log(`   January:   ${sunshineData.jan} hours`);
    console.log(`   February:  ${sunshineData.feb} hours`);
    console.log(`   March:     ${sunshineData.mar} hours`);
    console.log(`   April:     ${sunshineData.apr} hours`);
    console.log(`   May:       ${sunshineData.may} hours`);
    console.log(`   June:      ${sunshineData.jun} hours`);
    console.log(`   July:      ${sunshineData.jul} hours`);
    console.log(`   August:    ${sunshineData.aug} hours`);
    console.log(`   September: ${sunshineData.sep} hours`);
    console.log(`   October:   ${sunshineData.oct} hours`);
    console.log(`   November:  ${sunshineData.nov} hours`);
    console.log(`   December:  ${sunshineData.dec} hours`);
    console.log(`   Annual:    ${sunshineData.annual} hours`);

    const result = await prisma.monthlySunshine.upsert({
      where: { cityId: city.id },
      update: sunshineData,
      create: {
        cityId: city.id,
        ...sunshineData,
      },
    });

    console.log('\n✅ Sunshine data successfully saved!');
    console.log(`   Record ID: ${result.id}`);
    console.log(`   City ID: ${result.cityId}`);

    // Step 4: Verify the data was saved
    const verification = await prisma.monthlySunshine.findUnique({
      where: { cityId: city.id },
      include: { city: true },
    });

    if (verification) {
      console.log('\n✅ Verification successful!');
      console.log(
        `   Data for ${verification.city.name}${verification.city.state ? `, ${verification.city.state}` : ''} is in the database`
      );
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✨ Script completed successfully!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('\n❌ Error occurred:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  console.log(
    `\n🌍 Processing ${CITIES_TO_ADD.length} ${CITIES_TO_ADD.length === 1 ? 'city' : 'cities'}...\n`
  );

  for (const city of CITIES_TO_ADD) {
    await addManuallySunshineData(city.name, city.state, city.country, city.sunshineHours);
    console.log('\n'); // Add spacing between cities
  }

  console.log(
    `\n✅ All ${CITIES_TO_ADD.length} ${CITIES_TO_ADD.length === 1 ? 'city has' : 'cities have'} been processed!\n`
  );
}

main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
