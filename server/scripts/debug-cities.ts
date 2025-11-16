import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCities() {
  console.log('🔍 Debugging city matching issues\n');

  // cities from CSV that weren't found
  const testCities = [
    { name: 'Gagnoa', country: 'Ivory Coast' },
    { name: 'Abidjan', country: 'Ivory Coast' },
    { name: 'Cairo', country: 'Egypt' },
    { name: 'Dakar', country: 'Senegal' },
    { name: 'New York City', country: 'United States' },
    { name: 'Brasília', country: 'Brazil' },
    { name: 'Addis Abeba', country: 'Ethiopia' },
  ];

  for (const testCity of testCities) {
    console.log(`\n📍 Looking for: "${testCity.name}" in "${testCity.country}"`);

    // exact match
    const exactMatch = await prisma.city.findFirst({
      where: {
        name: testCity.name,
        country: testCity.country,
      },
    });

    if (exactMatch) {
      console.log(`  ✅ Found exact match: ${exactMatch.name}`);
      continue;
    }

    // try partial match on country
    const countryCities = await prisma.city.findMany({
      where: {
        country: testCity.country,
      },
      take: 10,
    });

    if (countryCities.length > 0) {
      console.log(`  ⚠️  No exact match. Cities in "${testCity.country}":`);
      countryCities.forEach((city) => {
        console.log(`     - ${city.name}`);
      });
    } else {
      console.log(`  ❌ No cities found for country: "${testCity.country}"`);

      // try to find similar country names
      const similarCountries = await prisma.city.findMany({
        where: {
          country: {
            contains: testCity.country.split(' ')[0],
            mode: 'insensitive',
          },
        },
        distinct: ['country'],
        take: 5,
      });

      if (similarCountries.length > 0) {
        console.log(`  💡 Similar country names found:`);
        similarCountries.forEach((city) => {
          console.log(`     - ${city.country}`);
        });
      }
    }
  }

  // show total cities by country
  console.log('\n\n📊 Total cities by country (sample):');
  const countryCounts = await prisma.city.groupBy({
    by: ['country'],
    _count: true,
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 20,
  });

  countryCounts.forEach((row) => {
    console.log(`  ${row.country}: ${row._count} cities`);
  });

  await prisma.$disconnect();
}

debugCities().catch(console.error);
