import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Define interfaces for the CSV record types
interface SunshineRecord {
  City: string;
  Country: string;
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
  [key: string]: string;
}

interface ProcessedSunshineRecord {
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
  [key: string]: string;
}

interface DuplicateEntry {
  index: number;
  city: string;
  country: string;
  firstIndex: number;
}

// Path to the CSV file
const csvFilePath = path.resolve(
  __dirname,
  '../../dataAndUtils/legacy/weather_data/Sunshine_hours_world_cities.csv'
);

// Function to get full state name from abbreviation
function getFullStateName(abbr: string): string {
  const stateMap: { [key: string]: string } = {
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
    DC: 'District of Columbia',
  };

  return stateMap[abbr] || abbr;
}

// Function to extract state/region from city name with various patterns
function extractStateFromCity(city: string, country: string): { cityName: string; state: string } {
  // Pattern 1: "City (XX)" where XX is a US state code
  const stateCodeMatch = city.match(/^(.+?)\s*\(([A-Z]{2})\)$/);
  if (stateCodeMatch) {
    const state = getFullStateName(stateCodeMatch[2]);
    const cityName = stateCodeMatch[1].trim();
    return { cityName, state };
  }

  // Pattern 2: "City (Region)" where Region is a full name
  const regionMatch = city.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (regionMatch) {
    const cityName = regionMatch[1].trim();
    const state = regionMatch[2].trim();
    return { cityName, state };
  }

  // Pattern 3: "City, Region" format
  const commaMatch = city.match(/^(.+?),\s*(.+)$/);
  if (commaMatch) {
    const cityName = commaMatch[1].trim();
    const state = commaMatch[2].trim();
    return { cityName, state };
  }

  // Add known states for specific cities based on country
  if (country === 'United States') {
    // Map of known US cities to their states
    const usStateLookup: Record<string, string> = {
      Albuquerque: 'New Mexico',
      Anchorage: 'Alaska',
      Atlanta: 'Georgia',
      Austin: 'Texas',
      Baltimore: 'Maryland',
      Boise: 'Idaho',
      Boston: 'Massachusetts',
      Charlotte: 'North Carolina',
      Chicago: 'Illinois',
      Cleveland: 'Ohio',
      Columbus: 'Ohio',
      Dallas: 'Texas',
      Denver: 'Colorado',
      Detroit: 'Michigan',
      'El Paso': 'Texas',
      Fresno: 'California',
      Honolulu: 'Hawaii',
      Houston: 'Texas',
      Indianapolis: 'Indiana',
      Jacksonville: 'Florida',
      'Kansas City': 'Missouri',
      'Las Vegas': 'Nevada',
      'Los Angeles': 'California',
      Louisville: 'Kentucky',
      Memphis: 'Tennessee',
      Miami: 'Florida',
      Milwaukee: 'Wisconsin',
      Minneapolis: 'Minnesota',
      Nashville: 'Tennessee',
      'New Orleans': 'Louisiana',
      'New York': 'New York',
      Nome: 'Alaska',
      'Oklahoma City': 'Oklahoma',
      Omaha: 'Nebraska',
      Philadelphia: 'Pennsylvania',
      Phoenix: 'Arizona',
      Pittsburgh: 'Pennsylvania',
      Raleigh: 'North Carolina',
      Sacramento: 'California',
      'Salt Lake City': 'Utah',
      'San Antonio': 'Texas',
      'San Diego': 'California',
      'San Francisco': 'California',
      Seattle: 'Washington',
      'St. Louis': 'Missouri',
      Tampa: 'Florida',
      Tucson: 'Arizona',
      Tulsa: 'Oklahoma',
      'Virginia Beach': 'Virginia',
      'Washington D.C.': 'District of Columbia',
      Wichita: 'Kansas',
      Yuma: 'Arizona',
    };

    if (usStateLookup[city]) {
      return { cityName: city, state: usStateLookup[city] };
    }
  }

  return { cityName: city, state: '' };
}

// Function to read and process the CSV file
async function processCSV() {
  try {
    // Read the CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');

    // Parse the CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as SunshineRecord[];

    console.log(`Total records: ${records.length}`);

    // Check for duplicates
    const cityCountryMap = new Map<string, number>();
    const duplicates: DuplicateEntry[] = [];

    records.forEach((record: SunshineRecord, index: number) => {
      const key = `${record.City},${record.Country}`.toLowerCase();

      if (cityCountryMap.has(key)) {
        duplicates.push({
          index,
          city: record.City,
          country: record.Country,
          firstIndex: cityCountryMap.get(key) || 0,
        });
      } else {
        cityCountryMap.set(key, index);
      }
    });

    console.log(`Found ${duplicates.length} duplicate entries.`);

    // Add State field and process city names
    const processedRecords = records.map((record: SunshineRecord) => {
      const { cityName, state } = extractStateFromCity(record.City, record.Country);

      // Create a new record with the State field
      const newRecord: ProcessedSunshineRecord = {
        Country: record.Country,
        City: cityName,
        State: state,
        Jan: record.Jan,
        Feb: record.Feb,
        Mar: record.Mar,
        Apr: record.Apr,
        May: record.May,
        Jun: record.Jun,
        Jul: record.Jul,
        Aug: record.Aug,
        Sep: record.Sep,
        Oct: record.Oct,
        Nov: record.Nov,
        Dec: record.Dec,
        Year: record.Year,
      };

      return newRecord;
    });

    // Remove duplicates
    const uniqueRecords = Array.from(
      new Map(
        processedRecords.map((record: ProcessedSunshineRecord) => [
          `${record.Country},${record.City},${record.State}`.toLowerCase(),
          record,
        ])
      ).values()
    );

    console.log(`After removing duplicates: ${uniqueRecords.length} records`);

    // Sort the records by country and then by city
    const sortedRecords = uniqueRecords.sort(
      (a: ProcessedSunshineRecord, b: ProcessedSunshineRecord) => {
        // First sort by country
        const countryComparison = a.Country.localeCompare(b.Country);

        // If countries are the same, sort by city
        if (countryComparison === 0) {
          return a.City.localeCompare(b.City);
        }

        return countryComparison;
      }
    );

    // Convert back to CSV manually
    const headers = Object.keys(sortedRecords[0]);
    const csvLines = [headers.join(',')];

    // Add data rows
    sortedRecords.forEach((record) => {
      const row = headers.map((header) => {
        const value = record[header];
        // Handle values that might contain commas by quoting them
        if (value && typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value !== null && value !== undefined ? value : '';
      });
      csvLines.push(row.join(','));
    });

    // Join with newlines and write to file
    const sortedCsv = csvLines.join('\n');
    fs.writeFileSync(csvFilePath, sortedCsv);

    console.log('CSV file has been processed:');
    console.log('- Added State field');
    console.log('- Extracted state information from city names');
    console.log('- Removed duplicates');
    console.log('- Sorted by country and city');
  } catch (error) {
    console.error('Error processing CSV file:', error);
  }
}

// Run the function
processCSV();
