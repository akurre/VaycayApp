/**
 * update cities with missing population data from worldcities.csv
 *
 * matches cities based on:
 * 1. direct worldcitiesId lookup (most reliable — no fuzzy matching needed)
 * 2. city name + country + state/admin_name (case-insensitive, normalized)
 * 3. coordinates within 0.3 degrees (~33km) as tiebreaker
 */

import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

// configuration
const WORLDCITIES_PATH = path.join(__dirname, '../../dataAndUtils/worldcities.csv');
const MAX_DISTANCE_DEGREES = 0.3; // ~33km at equator
const DRY_RUN = process.argv.includes('--dry-run');
// repair mode: re-verify cities that already have a population and fix wrong ones
const REPAIR_MODE = process.argv.includes('--repair');

interface WorldCity {
  city: string;
  city_ascii: string;
  lat: number;
  lng: number;
  country: string;
  iso2: string;
  iso3: string;
  admin_name: string;
  capital: string;
  population: number;
  id: string;
}

interface MatchResult {
  cityId: number;
  cityName: string;
  country: string;
  state: string | null;
  dbLat: number;
  dbLong: number;
  matchedCity: string;
  matchedLat: number;
  matchedLng: number;
  distance: number;
  population: number;
  matchMethod: 'worldcities-id' | 'fuzzy';
}

/**
 * normalize city name for matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // remove special characters
    .replace(/\s+/g, ' '); // normalize whitespace
}

/**
 * calculate distance between two coordinates in degrees
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dlat = Math.abs(lat1 - lat2);
  const dlon = Math.abs(lon1 - lon2);
  // eslint and prettier keep fighting about which is better
  // eslint-disable-next-line no-mixed-operators
  return Math.sqrt(dlat * dlat + dlon * dlon);
}

/**
 * load worldcities.csv
 */
function loadWorldCities(): WorldCity[] {
  console.log(`loading worldcities.csv from: ${WORLDCITIES_PATH}`);

  const fileContent = readFileSync(WORLDCITIES_PATH, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];

  const cities: WorldCity[] = records.map((record) => ({
    city: record.city,
    city_ascii: record.city_ascii,
    lat: parseFloat(record.lat),
    lng: parseFloat(record.lng),
    country: record.country,
    iso2: record.iso2,
    iso3: record.iso3,
    admin_name: record.admin_name,
    capital: record.capital,
    population: parseInt(record.population, 10) || 0,
    id: record.id,
  }));

  console.log(`loaded ${cities.length} cities from worldcities.csv`);
  return cities;
}

/**
 * build a lookup map from worldcities id → WorldCity for O(1) direct lookups
 */
function indexWorldCitiesById(worldCities: WorldCity[]): Map<string, WorldCity> {
  const map = new Map<string, WorldCity>();
  for (const wc of worldCities) {
    map.set(wc.id, wc);
  }
  return map;
}

/**
 * find matching city in worldcities data using fuzzy name+country+state matching.
 * state is used when available to prevent same-name cities in different regions
 * from matching each other (e.g. Houston TX vs Houston MS).
 */
function findMatch(
  cityName: string,
  country: string,
  state: string | null,
  lat: number,
  long: number,
  worldCities: WorldCity[]
): WorldCity | null {
  const normalizedCityName = normalizeName(cityName);
  const normalizedCountry = normalizeName(country);
  const normalizedState = state ? normalizeName(state) : null;

  // find candidates matching city name and country
  const candidates = worldCities.filter((wc) => {
    const matchesCity =
      normalizeName(wc.city) === normalizedCityName ||
      normalizeName(wc.city_ascii) === normalizedCityName;
    const matchesCountry = normalizeName(wc.country) === normalizedCountry;
    if (!matchesCity || !matchesCountry) return false;

    // when state is known, require admin_name to match — prevents e.g. Houston TX
    // from being assigned to Houston MS
    if (normalizedState) {
      return normalizeName(wc.admin_name) === normalizedState;
    }
    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  // calculate distance to each candidate
  const candidatesWithDistance = candidates.map((candidate) => ({
    ...candidate,
    distance: calculateDistance(lat, long, candidate.lat, candidate.lng),
  }));

  // filter by max distance
  const nearCandidates = candidatesWithDistance.filter((c) => c.distance <= MAX_DISTANCE_DEGREES);

  if (nearCandidates.length === 0) {
    return null;
  }

  // sort by distance (closest first) and population (highest first)
  nearCandidates.sort((a, b) => {
    if (Math.abs(a.distance - b.distance) < 0.01) {
      return b.population - a.population;
    }
    return a.distance - b.distance;
  });

  return nearCandidates[0];
}

interface CityRow {
  id: number;
  name: string;
  country: string;
  state: string | null;
  lat: number;
  long: number;
  worldcitiesId: number | null;
}

/**
 * resolve the correct worldcities match for a city, trying direct ID first then fuzzy
 */
function resolveMatch(
  city: CityRow,
  worldCities: WorldCity[],
  worldCitiesById: Map<string, WorldCity>
): { match: WorldCity; method: MatchResult['matchMethod'] } | null {
  if (city.worldcitiesId !== null) {
    const direct = worldCitiesById.get(String(Math.round(city.worldcitiesId)));
    if (direct && direct.population > 0) {
      return { match: direct, method: 'worldcities-id' };
    }
  }
  const fuzzy = findMatch(city.name, city.country, city.state, city.lat, city.long, worldCities);
  return fuzzy ? { match: fuzzy, method: 'fuzzy' } : null;
}

function printFillSummary(matches: MatchResult[], noMatchCount: number, total: number) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('summary');
  console.log('='.repeat(80));
  console.log(`total cities without population: ${total}`);
  console.log(`successfully matched: ${matches.length}`);
  console.log(`no matches found: ${noMatchCount}`);

  if (matches.length > 0) {
    const byId = matches.filter((m) => m.matchMethod === 'worldcities-id').length;
    const byFuzzy = matches.filter((m) => m.matchMethod === 'fuzzy').length;
    console.log(`\nmatch method breakdown:`);
    console.log(`  direct id lookup: ${byId}`);
    console.log(`  fuzzy name+state: ${byFuzzy}`);

    const fuzzyMatches = matches.filter((m) => m.matchMethod === 'fuzzy');
    if (fuzzyMatches.length > 0) {
      const avgDistance =
        fuzzyMatches.reduce((sum, m) => sum + m.distance, 0) / fuzzyMatches.length;
      const maxDistance = Math.max(...fuzzyMatches.map((m) => m.distance));
      const minDistance = Math.min(...fuzzyMatches.map((m) => m.distance));
      console.log(`\nfuzzy match distance statistics:`);
      console.log(`  min: ${minDistance.toFixed(3)}°`);
      console.log(`  avg: ${avgDistance.toFixed(3)}°`);
      console.log(`  max: ${maxDistance.toFixed(3)}°`);
    }
  }

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - no changes were made to database');
    console.log('run without --dry-run flag to apply changes');
  } else {
    console.log(`\n✓ successfully updated ${matches.length} cities with population data`);
  }
}

/**
 * fill mode: update cities whose population is null
 */
async function runFill(worldCities: WorldCity[], worldCitiesById: Map<string, WorldCity>) {
  console.log('\nquerying cities with null population...');
  const cities = await prisma.city.findMany({
    where: { population: null },
    select: {
      id: true,
      name: true,
      country: true,
      state: true,
      lat: true,
      long: true,
      worldcitiesId: true,
    },
  });

  console.log(`found ${cities.length} cities without population\n`);
  if (cities.length === 0) {
    console.log('no cities need population updates!');
    return;
  }

  const matches: MatchResult[] = [];
  const noMatches: typeof cities = [];

  console.log('matching cities...\n');
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    if ((i + 1) % 1000 === 0 || i === 0) {
      console.log(`progress: ${i + 1}/${cities.length} cities processed...`);
    }

    const result = resolveMatch(city, worldCities, worldCitiesById);
    if (result) {
      const distance = calculateDistance(city.lat, city.long, result.match.lat, result.match.lng);
      matches.push({
        cityId: city.id,
        cityName: city.name,
        country: city.country,
        state: city.state,
        dbLat: city.lat,
        dbLong: city.long,
        matchedCity: result.match.city,
        matchedLat: result.match.lat,
        matchedLng: result.match.lng,
        distance,
        population: result.match.population,
        matchMethod: result.method,
      });
      if (!DRY_RUN) {
        await prisma.city.update({
          where: { id: city.id },
          data: { population: result.match.population },
        });
      }
    } else {
      noMatches.push(city);
    }
  }

  printFillSummary(matches, noMatches.length, cities.length);
}

/**
 * repair mode: re-verify cities that already have a population and correct wrong values.
 * - cities with worldcitiesId: compare DB pop to the worldcities entry and fix if different
 * - cities without worldcitiesId: re-run fuzzy match; if it returns null or a different pop,
 *   reset to null so the value is unknown rather than wrong
 */
async function runRepair(worldCities: WorldCity[], worldCitiesById: Map<string, WorldCity>) {
  console.log('\nquerying all cities with non-null population...');
  const cities = await prisma.city.findMany({
    where: { population: { not: null } },
    select: {
      id: true,
      name: true,
      country: true,
      state: true,
      lat: true,
      long: true,
      worldcitiesId: true,
      population: true,
    },
  });

  console.log(`found ${cities.length} cities with population to verify\n`);

  const fixes: Array<{
    id: number;
    name: string;
    country: string;
    state: string | null;
    oldPop: number;
    newPop: number | null;
    reason: string;
  }> = [];

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    if ((i + 1) % 5000 === 0 || i === 0) {
      console.log(`progress: ${i + 1}/${cities.length} cities verified...`);
    }

    const dbPop = city.population as number;
    const result = resolveMatch(city, worldCities, worldCitiesById);
    const correctPop = result ? result.match.population : null;

    if (correctPop !== dbPop) {
      const reason = result
        ? `${result.method} match gives ${result.match.population.toLocaleString()} (was ${dbPop.toLocaleString()})`
        : `no match found — resetting to null (was ${dbPop.toLocaleString()})`;
      fixes.push({
        id: city.id,
        name: city.name,
        country: city.country,
        state: city.state,
        oldPop: dbPop,
        newPop: correctPop,
        reason,
      });

      if (!DRY_RUN) {
        await prisma.city.update({ where: { id: city.id }, data: { population: correctPop } });
      }
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('repair summary');
  console.log('='.repeat(80));
  console.log(`total cities verified: ${cities.length}`);
  console.log(`corrections needed:    ${fixes.length}`);

  if (fixes.length > 0) {
    console.log('\ncorrections:');
    for (const f of fixes) {
      const loc = [f.name, f.state, f.country].filter(Boolean).join(', ');
      console.log(`  ${loc}: ${f.reason}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - no changes were made to database');
  } else {
    console.log(`\n✓ corrected ${fixes.length} cities`);
  }
}

/**
 * main execution
 */
async function main() {
  console.log('='.repeat(80));
  console.log(
    REPAIR_MODE ? 'repairing wrong population data' : 'updating cities with missing population data'
  );
  console.log('='.repeat(80));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - no changes will be made to database\n');
  }

  const worldCities = loadWorldCities();
  const worldCitiesById = indexWorldCitiesById(worldCities);

  if (REPAIR_MODE) {
    await runRepair(worldCities, worldCitiesById);
  } else {
    await runFill(worldCities, worldCitiesById);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
