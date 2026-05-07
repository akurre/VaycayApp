/**
 * Weekly Weather Aggregation Script
 *
 * This script aggregates daily weather data into weekly statistics for each city.
 * It processes all cities in the database and creates/updates WeeklyWeather records
 * with 52 weeks of aggregated data per city.
 *
 * The aggregation calculates:
 * - Average, max, and min temperatures per week
 * - Total and average precipitation per week
 * - Days with rain per week
 * - Data quality metrics (days with data)
 *
 * Usage:
 * npm run aggregate-weekly-weather
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Minimum days required per week for statistical validity
const MIN_DAYS_FOR_VALID_STATS = 2;

interface WeekData {
  week: number;
  avgTemp: number | null;
  maxTemp: number | null;
  minTemp: number | null;
  totalPrecip: number | null;
  avgPrecip: number | null;
  daysWithRain: number | null;
  daysWithData: number;
}

interface WeatherRecordInput {
  TAVG: number | null;
  TMAX: number | null;
  TMIN: number | null;
  PRCP: number | null;
}

interface DailyRecord {
  date: string;
  TAVG: number | null;
  TMAX: number | null;
  TMIN: number | null;
  PRCP: number | null;
}

/**
 * Collapse multiple station readings on the same date into one row.
 * Cities can have 2+ stations; without this, each calendar day appears multiple
 * times and rainy-day counts inflate (a storm day counted once per station).
 * PRCP/TAVG: cross-station mean. TMAX: max across stations. TMIN: min.
 */
function collapseStationsByDate(
  records: ReadonlyArray<{ date: string } & WeatherRecordInput>
): DailyRecord[] {
  const byDate = new Map<
    string,
    { TAVG: number[]; TMAX: number[]; TMIN: number[]; PRCP: number[] }
  >();
  for (const r of records) {
    const entry = byDate.get(r.date) ?? { TAVG: [], TMAX: [], TMIN: [], PRCP: [] };
    if (r.TAVG !== null && !Number.isNaN(r.TAVG)) entry.TAVG.push(r.TAVG);
    if (r.TMAX !== null && !Number.isNaN(r.TMAX)) entry.TMAX.push(r.TMAX);
    if (r.TMIN !== null && !Number.isNaN(r.TMIN)) entry.TMIN.push(r.TMIN);
    if (r.PRCP !== null && !Number.isNaN(r.PRCP)) entry.PRCP.push(r.PRCP);
    byDate.set(r.date, entry);
  }

  const mean = (arr: number[]): number | null =>
    arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null;

  const dailyRecords: DailyRecord[] = [];
  for (const [date, m] of byDate) {
    dailyRecords.push({
      date,
      TAVG: mean(m.TAVG),
      TMAX: m.TMAX.length ? Math.max(...m.TMAX) : null,
      TMIN: m.TMIN.length ? Math.min(...m.TMIN) : null,
      PRCP: mean(m.PRCP),
    });
  }
  return dailyRecords;
}

/**
 * Calculate ISO week number from date string (1-52)
 * Uses ISO 8601 week date system where week 1 is the first week with a Thursday.
 * Note: Caps week 53 to week 52 to ensure consistent 52-week data structure.
 * This merges the last few days of December into week 52 when they fall in ISO week 53.
 */
function getISOWeek(dateStr: string): number {
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  // Ensure we return 1-52, capping at 52 for week 53
  return Math.min(weekNo, 52);
}

/**
 * Calculate statistical aggregations for a week's worth of weather records.
 * numYears * 7 is the daysWithData denominator (not records.length) because
 * NOAA stations that only log precipitation days otherwise produce 7/7 rainy.
 */
function calculateWeekStats(
  records: WeatherRecordInput[],
  numYears: number
): Omit<WeekData, 'week'> {
  const validTemps = records.filter(
    (r): r is WeatherRecordInput & { TAVG: number } => r.TAVG !== null
  );
  const validMaxTemps = records.filter(
    (r): r is WeatherRecordInput & { TMAX: number } => r.TMAX !== null
  );
  const validMinTemps = records.filter(
    (r): r is WeatherRecordInput & { TMIN: number } => r.TMIN !== null
  );
  const validPrecip = records.filter(
    (r): r is WeatherRecordInput & { PRCP: number } => r.PRCP !== null
  );

  const totalCalendarDays = Math.max(numYears * 7, records.length);
  // Require at least MIN_DAYS_FOR_VALID_STATS days of data per week for statistical validity
  const hasEnoughData = records.length >= MIN_DAYS_FOR_VALID_STATS;

  return {
    avgTemp:
      hasEnoughData && validTemps.length >= MIN_DAYS_FOR_VALID_STATS
        ? validTemps.reduce((sum, r) => sum + r.TAVG, 0) / validTemps.length
        : null,
    maxTemp:
      hasEnoughData && validMaxTemps.length >= MIN_DAYS_FOR_VALID_STATS
        ? validMaxTemps.reduce((sum, r) => sum + r.TMAX, 0) / validMaxTemps.length
        : null,
    minTemp:
      hasEnoughData && validMinTemps.length >= MIN_DAYS_FOR_VALID_STATS
        ? validMinTemps.reduce((sum, r) => sum + r.TMIN, 0) / validMinTemps.length
        : null,
    totalPrecip:
      hasEnoughData && validPrecip.length >= MIN_DAYS_FOR_VALID_STATS
        ? validPrecip.reduce((sum, r) => sum + r.PRCP, 0)
        : null,
    avgPrecip:
      hasEnoughData && validPrecip.length >= MIN_DAYS_FOR_VALID_STATS
        ? validPrecip.reduce((sum, r) => sum + r.PRCP, 0) / validPrecip.length
        : null,
    // Use 1mm threshold (meteorological standard for a "rain day") rather than
    // > 0, so trace precipitation (dew, condensation, station noise) doesn't
    // count. Some NOAA stations log 0.1mm on otherwise dry days.
    daysWithRain: hasEnoughData ? validPrecip.filter((r) => r.PRCP >= 1).length : null,
    daysWithData: totalCalendarDays,
  };
}

/**
 * Main aggregation function
 * Processes all cities and creates weekly aggregated weather data
 */
async function aggregateWeeklyWeather() {
  console.log('🌤️  Starting weekly weather aggregation...\n');

  // Get all cities
  const cities = await prisma.city.findMany({
    select: { id: true, name: true, country: true },
  });

  console.log(`Found ${cities.length} cities to process\n`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const city of cities) {
    try {
      // Fetch all weather records for this city
      const records = await prisma.weatherRecord.findMany({
        where: { cityId: city.id },
        select: {
          date: true,
          TAVG: true,
          TMAX: true,
          TMIN: true,
          PRCP: true,
        },
      });

      if (records.length === 0) {
        console.log(
          `⚠️  ${city.name}, ${city.country}: No weather data available, skipping aggregation`
        );
        skippedCount++;
        continue;
      }

      // Collapse multi-station rows into one row per calendar date before any
      // week-level math, so rainy-day counts don't double-count two stations
      // both logging the same storm day.
      const dailyRecords = collapseStationsByDate(records);

      // Used as the rainy-day normalization denominator so weeks with no rain
      // in some years still divide by the full year count.
      const totalYears = new Set(dailyRecords.map((r) => new Date(r.date).getFullYear())).size;

      // Group daily records by ISO week
      const weeklyRecords: Record<number, DailyRecord[]> = {};

      for (const record of dailyRecords) {
        const week = getISOWeek(record.date);
        if (!weeklyRecords[week]) {
          weeklyRecords[week] = [];
        }
        weeklyRecords[week].push(record);
      }

      // Calculate stats for each week (1-52)
      const weeklyData: WeekData[] = [];

      for (let week = 1; week <= 52; week++) {
        const weekRecords = weeklyRecords[week] || [];
        const stats = calculateWeekStats(weekRecords, totalYears);
        weeklyData.push({
          week,
          ...stats,
        });
      }

      // Upsert into database
      await prisma.weeklyWeather.upsert({
        where: { cityId: city.id },
        create: {
          cityId: city.id,
          weeklyData: weeklyData as any, // Prisma JSON type - validated by WeekData interface
        },
        update: {
          weeklyData: weeklyData as any, // Prisma JSON type - validated by WeekData interface
        },
      });

      processedCount++;

      if (processedCount % 100 === 0) {
        console.log(`✓ Processed ${processedCount}/${cities.length} cities`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing ${city.name}, ${city.country}:`, error);
    }
  }

  console.log(`\n✅ Aggregation complete!`);
  console.log(`   Processed: ${processedCount} cities`);
  console.log(`   Skipped: ${skippedCount} cities (no data)`);
  console.log(`   Errors: ${errorCount} cities`);

  // Verify the data
  const weeklyWeatherCount = await prisma.weeklyWeather.count();
  console.log(`\n📊 Total WeeklyWeather records in database: ${weeklyWeatherCount}`);
}

// Run
aggregateWeeklyWeather()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
