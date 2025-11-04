/**
 * update cities with missing population data from worldcities.csv
 * 
 * matches cities based on:
 * - city name (case-insensitive, normalized)
 * - country (case-insensitive)
 * - coordinates within 0.3 degrees (~33km)
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// configuration
const WORLDCITIES_PATH = path.join(__dirname, '../../dataAndUtils/worldcities.csv');
const MAX_DISTANCE_DEGREES = 0.3; // ~33km at equator
const DRY_RUN = process.argv.includes('--dry-run');

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
  dbLat: number;
  dbLong: number;
  matchedCity: string;
  matchedLat: number;
  matchedLng: number;
  distance: number;
  population: number;
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
  return Math.sqrt(dlat * dlat + dlon * dlon);
}

/**
 * load worldcities.csv
 */
function loadWorldCities(): WorldCity[] {
  console.log(`loading worldcities.csv from: ${WORLDCITIES_PATH}`);
  
  const fileContent = fs.readFileSync(WORLDCITIES_PATH, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const cities: WorldCity[] = records.map((record: any) => ({
    city: record.city,
    city_ascii: record.city_ascii,
    lat: parseFloat(record.lat),
    lng: parseFloat(record.lng),
    country: record.country,
    iso2: record.iso2,
    iso3: record.iso3,
    admin_name: record.admin_name,
    capital: record.capital,
    population: parseInt(record.population) || 0,
    id: record.id,
  }));

  console.log(`loaded ${cities.length} cities from worldcities.csv`);
  return cities;
}

/**
 * find matching city in worldcities data
 */
function findMatch(
  cityName: string,
  country: string,
  lat: number,
  long: number,
  worldCities: WorldCity[]
): WorldCity | null {
  const normalizedCityName = normalizeName(cityName);
  const normalizedCountry = normalizeName(country);

  // find candidates matching city name and country
  const candidates = worldCities.filter((wc) => {
    const matchesCity =
      normalizeName(wc.city) === normalizedCityName ||
      normalizeName(wc.city_ascii) === normalizedCityName;
    const matchesCountry = normalizeName(wc.country) === normalizedCountry;
    return matchesCity && matchesCountry;
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
  const nearCandidates = candidatesWithDistance.filter(
    (c) => c.distance <= MAX_DISTANCE_DEGREES
  );

  if (nearCandidates.length === 0) {
    return null;
  }

  // sort by distance (closest first) and population (highest first)
  nearCandidates.sort((a, b) => {
    if (Math.abs(a.distance - b.distance) < 0.01) {
      // if distances are very similar, prefer higher population
      return b.population - a.population;
    }
    return a.distance - b.distance;
  });

  return nearCandidates[0];
}

/**
 * main execution
 */
async function main() {
  console.log('='.repeat(80));
  console.log('updating cities with missing population data');
  console.log('='.repeat(80));
  
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - no changes will be made to database\n');
  }

  // load worldcities data
  const worldCities = loadWorldCities();

  // query cities with null population
  console.log('\nquerying cities with null population...');
  const citiesWithoutPopulation = await prisma.city.findMany({
    where: {
      population: null,
    },
    select: {
      id: true,
      name: true,
      country: true,
      lat: true,
      long: true,
    },
  });

  console.log(`found ${citiesWithoutPopulation.length} cities without population\n`);

  if (citiesWithoutPopulation.length === 0) {
    console.log('no cities need population updates!');
    return;
  }

  // match and update cities
  const matches: MatchResult[] = [];
  const noMatches: typeof citiesWithoutPopulation = [];

  console.log('matching cities...\n');

  for (let i = 0; i < citiesWithoutPopulation.length; i++) {
    const city = citiesWithoutPopulation[i];
    const progress = `[${i + 1}/${citiesWithoutPopulation.length}]`;

    const match = findMatch(city.name, city.country, city.lat, city.long, worldCities);

    if (match) {
      const distance = calculateDistance(city.lat, city.long, match.lat, match.lng);
      
      console.log(`${progress} ${city.name}, ${city.country}`);
      console.log(`  ✓ matched: ${match.city} (${match.lat}, ${match.lng})`);
      console.log(`    distance: ${distance.toFixed(3)}° - population: ${match.population.toLocaleString()}`);

      matches.push({
        cityId: city.id,
        cityName: city.name,
        country: city.country,
        dbLat: city.lat,
        dbLong: city.long,
        matchedCity: match.city,
        matchedLat: match.lat,
        matchedLng: match.lng,
        distance,
        population: match.population,
      });

      // update database
      if (!DRY_RUN) {
        await prisma.city.update({
          where: { id: city.id },
          data: { population: match.population },
        });
      }
    } else {
      console.log(`${progress} ${city.name}, ${city.country}`);
      console.log(`  ✗ no match found`);
      noMatches.push(city);
    }
  }

  // print summary
  console.log('\n' + '='.repeat(80));
  console.log('summary');
  console.log('='.repeat(80));
  console.log(`total cities without population: ${citiesWithoutPopulation.length}`);
  console.log(`successfully matched: ${matches.length}`);
  console.log(`no matches found: ${noMatches.length}`);

  // distance distribution
  if (matches.length > 0) {
    const avgDistance = matches.reduce((sum, m) => sum + m.distance, 0) / matches.length;
    const maxDistance = Math.max(...matches.map((m) => m.distance));
    const minDistance = Math.min(...matches.map((m) => m.distance));
    
    console.log(`\ndistance statistics:`);
    console.log(`  min: ${minDistance.toFixed(3)}°`);
    console.log(`  avg: ${avgDistance.toFixed(3)}°`);
    console.log(`  max: ${maxDistance.toFixed(3)}°`);
  }

  // save unmatched cities to csv
  if (noMatches.length > 0) {
    const unmatchedCsv = 'city,country,lat,long\n' +
      noMatches.map((c) => `"${c.name}","${c.country}",${c.lat},${c.long}`).join('\n');
    
    const unmatchedPath = path.join(__dirname, 'unmatched-populations.csv');
    fs.writeFileSync(unmatchedPath, unmatchedCsv);
    console.log(`\nunmatched cities saved to: ${unmatchedPath}`);
  }

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN MODE - no changes were made to database');
    console.log('run without --dry-run flag to apply changes');
  } else {
    console.log(`\n✓ successfully updated ${matches.length} cities with population data`);
  }

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
