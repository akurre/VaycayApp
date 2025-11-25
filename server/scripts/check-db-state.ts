/**
 * Quick database state checker
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseState() {
  console.log('🔍 Checking Database State');
  console.log('='.repeat(80));
  console.log(`📍 Connection: ${process.env.DATABASE_URL || 'default from .env'}\n`);

  try {
    const cityCount = await prisma.city.count();
    const stationCount = await prisma.weatherStation.count();
    const recordCount = await prisma.weatherRecord.count();

    console.log('📊 Database Contents:');
    console.log(`  • Cities:           ${cityCount.toLocaleString()}`);
    console.log(`  • Weather stations: ${stationCount.toLocaleString()}`);
    console.log(`  • Weather records:  ${recordCount.toLocaleString()}\n`);

    // Check for TEMP-only cities
    const tempOnlyCities = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT c.id) as count
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
    `;

    // Check for PRCP-only cities
    const prcpOnlyCities = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT c.id) as count
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

    // Check for cities with both
    const completeCities = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT c.id) as count
      FROM cities c
      WHERE EXISTS (
        SELECT 1 FROM weather_records wr
        WHERE wr."cityId" = c.id
        AND (wr."TAVG" IS NOT NULL OR wr."TMAX" IS NOT NULL OR wr."TMIN" IS NOT NULL)
      )
      AND EXISTS (
        SELECT 1 FROM weather_records wr
        WHERE wr."cityId" = c.id
        AND wr."PRCP" IS NOT NULL
      )
    `;

    console.log('🏙️  City Classification:');
    console.log(`  • TEMP-only cities:       ${tempOnlyCities[0].count.toLocaleString()}`);
    console.log(`  • PRCP-only cities:       ${prcpOnlyCities[0].count.toLocaleString()}`);
    console.log(`  • Cities with both:       ${completeCities[0].count.toLocaleString()}`);
    console.log(
      `  • Total:                  ${(Number(tempOnlyCities[0].count) + Number(prcpOnlyCities[0].count) + Number(completeCities[0].count)).toLocaleString()}\n`
    );

    console.log('='.repeat(80));
  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await checkDatabaseState();
}

main().catch((error) => {
  console.error('💥 Check failed:', error);
  process.exit(1);
});
