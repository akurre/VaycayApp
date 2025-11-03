# Vaycay GraphQL Server

This is the backend GraphQL API for the Vaycay weather data platform, built with Apollo Server, Prisma, and TypeScript.

## 🏗️ Technology Stack

- **API Framework**: Apollo Server 4
- **Schema Definition**: Nexus (code-first GraphQL)
- **Database ORM**: Prisma
- **Language**: TypeScript 5.3+
- **Runtime**: Node.js 20+
- **Database**: PostgreSQL

## 📁 Project Structure

```
server/
├── src/
│   ├── index.ts              # Apollo Server entry point
│   ├── schema.ts             # Nexus schema generation
│   ├── context.ts            # GraphQL context (Prisma client)
│   └── graphql/
│       ├── index.ts          # Export all GraphQL types
│       ├── enums.ts          # GraphQL enums
│       └── WeatherData.ts    # Weather data queries & types
├── prisma/
│   ├── schema.prisma         # Prisma database schema
│   └── migrations/           # Database migrations
├── scripts/
│   └── import-data.ts        # Data import utility
├── Dockerfile                # Container configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm
- PostgreSQL database (running locally or via Docker)

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL=postgresql://postgres:iwantsun@localhost:5431/postgres
PORT=4001
NODE_ENV=development
```

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 4001)
- `NODE_ENV`: Environment mode (development/production)

3. **Generate Prisma Client**:
```bash
npm run prisma:generate
```

4. **Run database migrations**:
```bash
npm run prisma:migrate
```

5. **Import weather data** (optional):
```bash
npm run import-data
```

This imports the Italy dataset (214,054 records) from the legacy Python application.

6. **Start the development server**:
```bash
npm run dev
```

The GraphQL API will be available at:
- **GraphQL Endpoint**: http://localhost:4001/
- **GraphQL Playground**: http://localhost:4001/

## 📜 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server (requires build first) |
| `npm run generate` | Generate GraphQL schema file |
| `npm run prisma:generate` | Generate Prisma Client from schema |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (database GUI) |
| `npm run prisma:pull` | Pull schema from existing database |
| `npm run import-data` | Import weather data from JSON file |

## 🗄️ Database Schema

The application uses a single `weather_data` table with a composite primary key:

### WeatherData Model

```prisma
model WeatherData {
  // Composite primary key
  city   String
  date   String
  name   String  // Weather station name
  
  // Location information
  country    String?
  state      String?
  suburb     String?
  lat        String?
  long       String?
  population Float?
  
  // Weather metrics
  PRCP    Float?  // Precipitation (mm)
  SNWD    Float?  // Snow depth (mm)
  TAVG    Float?  // Average temperature (°C)
  TMAX    Float?  // Maximum temperature (°C)
  TMIN    Float?  // Minimum temperature (°C)
  
  // Metadata
  submitter_id String?
  
  @@id([city, date, name])
  @@index([date])
  @@index([city])
}
```

**Key Points:**
- Composite primary key: `(city, date, name)`
- Indexed fields: `date`, `city` for query performance
- Nullable fields: Most fields are optional to handle incomplete data
- Date format: `YYYY-MM-DD` (e.g., `2020-03-15`)

## 🔌 GraphQL API

### Schema Architecture

The GraphQL schema is built using **Nexus** (code-first approach):

1. **Type Definitions** (`src/graphql/WeatherData.ts`):
   - Defines the `WeatherData` object type
   - Maps Prisma model fields to GraphQL fields
   - Implements query resolvers

2. **Schema Generation** (`src/schema.ts`):
   - Combines all types and queries
   - Generates `schema.graphql` file
   - Provides type safety

3. **Context** (`src/context.ts`):
   - Provides Prisma client to resolvers
   - Handles database connections

### Query Optimization System

The API implements a **two-tier query system** for optimal performance:

#### Adaptive Quotas with Caching
- **Single-query approach** using PostgreSQL window functions
- **Fair distribution**: Adaptive per-country quotas (6-21 cities based on country count)
- **In-memory caching**: 1-hour TTL, <5ms response for cached queries
- **Performance**: ~300ms first request, <5ms cached

#### Zoom-Based Loading
- **Global view** (zoom 1-3): Uses `weatherByDate` query, returns 300 cities
- **Zoomed view** (zoom 4+): Uses `weatherByDateAndBounds` query with geographic filtering
- **Bounds-first filtering**: Reduces dataset by 90%+ when zoomed in
- **Performance**: 50-300ms depending on zoom level

### Available Queries

#### 1. `weatherData` - Paginated Weather Records
```graphql
query GetWeatherData {
  weatherData(limit: 10, offset: 0) {
    city
    country
    date
    avgTemperature
    maxTemperature
    minTemperature
    precipitation
    snowDepth
    stationName
  }
}
```

**Parameters:**
- `limit` (Int): Number of records to return
- `offset` (Int): Number of records to skip

#### 2. `weatherByDate` - Weather for Specific Date
```graphql
query GetSpringWeather {
  weatherByDate(monthDay: "0315") {
    city
    country
    avgTemperature
    maxTemperature
    precipitation
  }
}
```

**Parameters:**
- `monthDay` (String!): Date in `MMDD` format (e.g., `"0315"` for March 15)

**Implementation Details:**
- Queries all records where date ends with `-MM-DD`
- Returns weather data for that day across all years and cities

#### 3. `weatherByDateAndBounds` - Weather for Date within Geographic Bounds
```graphql
query GetNorthAmericaWeather {
  weatherByDateAndBounds(
    monthDay: "0315"
    minLat: 25
    maxLat: 50
    minLong: -125
    maxLong: -65
  ) {
    city
    country
    avgTemperature
    lat
    long
  }
}
```

**Parameters:**
- `monthDay` (String!): Date in `MMDD` format (e.g., `"0315"` for March 15)
- `minLat` (Int!): Minimum latitude
- `maxLat` (Int!): Maximum latitude
- `minLong` (Int!): Minimum longitude
- `maxLong` (Int!): Maximum longitude

**Implementation Details:**
- Filters by geographic bounds BEFORE applying quotas (90%+ performance improvement when zoomed)
- Uses same adaptive quota system as `weatherByDate`
- Optimized for zoomed map views (zoom level 4+)

#### 4. `weatherByCity` - Weather for Specific City
```graphql
query GetRomeWeather {
  weatherByCity(city: "Rome") {
    date
    avgTemperature
    maxTemperature
    minTemperature
    precipitation
  }
}
```

**Parameters:**
- `city` (String!): City name (case-insensitive)

#### 4. `cities` - List All Cities
```graphql
query GetAllCities {
  cities
}
```

Returns: Array of unique city names

#### 5. `countries` - List All Countries
```graphql
query GetAllCountries {
  countries
}
```

Returns: Array of unique country names

### GraphQL Type Definition

```graphql
type WeatherData {
  city: String!
  country: String
  state: String
  suburb: String
  date: String!
  lat: Float
  long: Float
  population: Float
  precipitation: Float
  snowDepth: Float
  avgTemperature: Float
  maxTemperature: Float
  minTemperature: Float
  stationName: String!
  submitterId: String
}
```

## 🔧 Development

### Adding New Queries

1. **Define the query in `src/graphql/WeatherData.ts`**:
```typescript
t.list.field('myNewQuery', {
  type: 'WeatherData',
  args: {
    myParam: stringArg(),
  },
  resolve: async (_, { myParam }, { prisma }) => {
    return prisma.weatherData.findMany({
      where: { /* your conditions */ },
    });
  },
});
```

2. **Regenerate the schema**:
```bash
npm run generate
```

3. **Test in GraphQL Playground**:
Navigate to http://localhost:4001/ and test your query

### Database Migrations

When modifying the Prisma schema:

1. **Update `prisma/schema.prisma`**
2. **Create migration**:
```bash
npm run prisma:migrate
```
3. **Regenerate Prisma Client**:
```bash
npm run prisma:generate
```

### Prisma Studio

To visually explore and edit database data:

```bash
npm run prisma:studio
```

This opens a web interface at http://localhost:5555

## 📊 Data Import

The `import-data.ts` script imports weather data from JSON files:

### Default Import (Italy Dataset)
```bash
npm run import-data
```

Imports: `legacy/python-api/vaycay/weather_data/16April2024/datacleaning4_nopopulation_wholeEurope.json`

### Custom Import
```bash
npm run import-data -- --file=path/to/your/data.json
```

**Expected JSON Format:**
```json
[
  {
    "city": "Rome",
    "country": "Italy",
    "date": "2020-03-15",
    "lat": "41.9028",
    "long": "12.4964",
    "TAVG": 15.5,
    "TMAX": 20.0,
    "TMIN": 11.0,
    "PRCP": 0.0,
    "name": "ROME CIAMPINO"
  }
]
```

**Import Process:**
1. Reads JSON file
2. Validates data structure
3. Batch inserts into PostgreSQL
4. Handles duplicates (skips existing records)
5. Reports success/failure statistics

## 🐳 Docker Deployment

### Building the Image
```bash
docker build -t vaycay-graphql-server .
```

### Running with Docker Compose
```bash
docker-compose up graphql-api
```

The Dockerfile uses a multi-stage build:
1. **Build stage**: Compiles TypeScript
2. **Production stage**: Runs compiled JavaScript

**Environment Variables in Docker:**
Set in `docker-compose.yml`:
```yaml
environment:
  DATABASE_URL: postgresql://postgres:iwantsun@db:5432/postgres
  PORT: 4001
  NODE_ENV: production
```

## 🔍 Debugging

### Enable Prisma Query Logging

Add to `src/context.ts`:
```typescript
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### View Server Logs

**Local development:**
```bash
npm run dev
# Logs appear in terminal
```

**Docker:**
```bash
docker-compose logs -f graphql-api
```

### Common Issues

#### Port Already in Use
```bash
# Find process using port 4001
lsof -i :4001

# Kill the process
kill -9 <PID>
```

#### Database Connection Failed
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists
- Test connection: `psql $DATABASE_URL`

#### Prisma Client Not Generated
```bash
npm run prisma:generate
```

#### Migration Errors
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually fix migrations
npx prisma migrate resolve --applied <migration_name>
```

## 🧪 Testing

### Manual Testing with GraphQL Playground

1. Start the server: `npm run dev`
2. Open http://localhost:4001/
3. Run test queries

### Example Test Queries

**Test data retrieval:**
```graphql
{
  weatherData(limit: 1) {
    city
    date
  }
}
```

**Test date query:**
```graphql
{
  weatherByDate(monthDay: "0101") {
    city
    avgTemperature
  }
}
```

**Test city query:**
```graphql
{
  weatherByCity(city: "Rome") {
    date
    avgTemperature
  }
}
```

## 📈 Performance Considerations

### Database Indexes

The schema includes indexes on frequently queried fields:
- `date`: For `weatherByDate` queries
- `city`: For `weatherByCity` queries

### Query Optimization

**Pagination:**
Always use `limit` and `offset` for large datasets:
```graphql
weatherData(limit: 100, offset: 0)
```

**Field Selection:**
Only request fields you need:
```graphql
weatherByCity(city: "Rome") {
  date
  avgTemperature  # Only these two fields
}
```

### Connection Pooling

Prisma automatically manages connection pooling. Configure in `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings if needed
}
```

## 🔐 Security

### Environment Variables

**Never commit `.env` files!**

The `.gitignore` includes:
```
.env
.env.local
.env.*.local
```

### Production Considerations

1. **Disable introspection** in production:
```typescript
const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
});
```

2. **Add rate limiting** (future enhancement)
3. **Implement authentication** (future enhancement)
4. **Use HTTPS** in production
5. **Validate input** in resolvers

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

**Production `.env`:**
```env
DATABASE_URL=postgresql://user:password@production-host:5432/dbname
PORT=4001
NODE_ENV=production
```

### Health Checks

The server logs startup information:
```
🚀 Vaycay GraphQL Server Ready!
📊 GraphQL endpoint: http://localhost:4001/
```

Monitor this output to ensure successful startup.

## 📚 Additional Resources

- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Nexus Documentation](https://nexusjs.org/)
- [GraphQL Documentation](https://graphql.org/learn/)

## 🤝 Contributing

When contributing to the server:

1. Follow TypeScript best practices
2. Update Prisma schema for database changes
3. Regenerate GraphQL schema after changes
4. Test queries in GraphQL Playground
5. Update this README for new features

## 📝 Notes

- The server uses **code-first** GraphQL schema generation (Nexus)
- Database schema is managed by **Prisma**
- All queries are read-only (no mutations implemented yet)
- Date format in database: `YYYY-MM-DD`
- Date format in API: `MMDD` for `weatherByDate` query
- Weather data represents historical averages, not real-time data
