# Vaycay Weather App

Hey, I'm Ashlen, welcome to my little side project (currently being developed).

**Vaycay** is a weather data API platform providing historical average weather data for locations worldwide. The system uses a modern TypeScript GraphQL API with a React frontend, enabling users to query weather statistics for specific dates or cities to help with vacation planning based on historical weather patterns.

**Important to note:** I built this originally with Python FastAPI in the very (very) start of my programming career, where I was moreso in the business of just playing with dataframes in pandas. I had not revisited it really until now (late Oct 2025), but I want to play with GraphQL / React in my own way. That being said, it's very primitive! Will be building it out as time goes on.

Why, you might ask, did I use GraphQL? Honestly, I just wanted to practice with a different framework. I am still fresh at GraphQL and need it for a client, so this is my way of getting in touch with it. 

Another note: I'm cheap, so instead of paying for an API, I sourced and cleaned all the data myself from numerous disjointed (but free) datasets online. Therefore, some inaccuracies will occur.

## 🎯 Project Goal

I want to be able to, in the cold dark of the German winters, look on a map at the warmest and closest place I can go with 20 degrees or above. I guess others can relate! 

In more fancy words? 

Provide access to historical average weather data for any given location and day of the year. Users can query weather metrics including temperature (average, min, max), precipitation, and snow depth for cities around the world. They should later be able to see how long it could take to fly there, what the city has to offer, their carbon impact, and other such ideas.

## 🏗️ Technology Stack

### Frontend (React)
- **Framework**: React 19 with TypeScript 5.7
- **Build Tool**: Vite 6
- **GraphQL Client**: Apollo Client 4.0.8
- **Routing**: React Router 6.30
- **Styling**: Tailwind CSS 4.1
- **Map Visualization**: React Leaflet 5.0 (with Leaflet)
- **Linting**: ESLint 9 with TypeScript ESLint 8
- **Code Formatting**: Prettier 3.6
- **Port**: 3000

### Backend (GraphQL API)
- **API Framework**: Apollo Server 4.11
- **Schema**: Nexus 1.3 (code-first GraphQL)
- **Database ORM**: Prisma 5.22
- **Language**: TypeScript 5.7
- **Runtime**: Node.js 20+ (required)
- **Development**: tsx 4.19 (TypeScript execution)
- **Linting**: ESLint 9 with TypeScript ESLint 8
- **Code Formatting**: Prettier 3.4
- **Port**: 4001

### Infrastructure
- **Database**: PostgreSQL (containerized with Docker)
- **Containerization**: Docker & Docker Compose
- **Environment Management**: dotenv

## 📊 Data Structure

### Weather Data Model

Each weather record contains:

- **Location Information**: city, country, state, suburb, lat, long, weather station name
- **Weather Metrics**: precipitation (mm), average/max/min temperature (°C), snow depth (mm)
- **Temporal Data**: date in format `YYYY-MM-DD` (e.g., `2020-03-15`)

### Database Schema

The application uses a PostgreSQL database with a single main table (`weather_data`) that stores all weather records. The table uses a composite primary key consisting of `city`, `date`, and `name` (weather station).

## 📋 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js 20+**: Required for running the GraphQL API and React frontend
- **npm**: Node package manager (comes with Node.js)
- **Docker & Docker Compose**: For running PostgreSQL database and containerized services

## 🚀 Quick Start (Recommended)

The easiest way to get started is using the provided Makefile:

```bash
# 1. Install all dependencies
make install

# 2. Setup database (migrations + data import)
make db-setup

# 3. Start all services
make dev
```

That's it! The application will be running at:
- **React Frontend**: http://localhost:3000
- **GraphQL API**: http://localhost:4001
- **PostgreSQL**: localhost:5431 (I run my jobs postgres on 5432 so...)

**To stop all services:**
```bash
make clean
```

**View all available commands:**
```bash
make help
```

### Available Make Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies (client + server) |
| `make db-setup` | Setup database (migrations + data import) |
| `make dev` | Start all services for development |
| `make server-dev` | Run GraphQL server only |
| `make client-dev` | Run React client only |
| `make db-start` | Start PostgreSQL database only |
| `make db-stop` | Stop PostgreSQL database |
| `make lint` | Check for ESLint errors in client and server |
| `make lint-fix` | Auto-fix ESLint errors in client and server |
| `make type-check` | Check for TypeScript errors in client and server |
| `make clean` | Stop all services and clean up |
| `make help` | Show all available commands |

## 🛠️ Manual Installation & Setup

**Note:** If the Makefile commands don't work on your system or you prefer more control over the setup process, you can follow these manual steps.

### Option 1: Docker Compose

The easiest way to run the entire stack:

```bash
# Start all services (database, GraphQL API, frontend)
docker-compose up

# Or run in detached mode
docker-compose up -d
```

This will start:
- **PostgreSQL**: localhost:5431
- **GraphQL API**: localhost:4001
- **React Frontend**: localhost:3000

### Option 2: Local Development

#### 1. Start PostgreSQL Database

```bash
docker-compose up db
```

#### 2. Set Up GraphQL API

```bash
cd server
npm install
npx prisma migrate dev
npm run import-data
npm run dev
```

The GraphQL API will be available at http://localhost:4001

**For detailed backend documentation, see [server/README.md](server/README.md)**

#### 3. Set Up React Frontend

```bash
cd client
npm install
npm start
```

The frontend will be available at http://localhost:3000

**For detailed frontend documentation, see [client/README.md](client/README.md)**

## 📁 Project Structure

```
vaycay_v2/
├── server/                          # GraphQL API (TypeScript)
│   ├── src/                         # Source code
│   ├── prisma/                      # Database schema & migrations
│   ├── scripts/                     # Utility scripts (data import)
│   └── README.md                    # Backend documentation
├── client/                          # React Frontend
│   ├── src/                         # Source code
│   ├── public/                      # Static assets
│   └── README.md                    # Frontend documentation
├── legacy/                          # Archived Python code
│   ├── python-api/                  # Original FastAPI application
│   └── README.md                    # Legacy documentation
├── uncleaned_data/                  # Raw data files
├── docker-compose.yml               # Docker services configuration
├── MIGRATION_PLAN.md                # Migration roadmap
└── README.md                        # This file
```

## 🚀 Quick Start Guide

### Using the Application

1. **Start the services**:
   ```bash
   docker-compose up
   ```

2. **Access the frontend**:
   - Open http://localhost:3000
   - Navigate to http://localhost:3000/day/03-15 to see weather data for March 15th

3. **Query the GraphQL API**:
   - Open http://localhost:4001 for GraphQL Playground
   - Try example queries (see [server/README.md](server/README.md) for details)

### Example GraphQL Query

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

## 🗄️ Data Source & Coverage

The application uses pre-processed historical weather data. The current dataset contains weather records for cities worldwide, with a focus on European locations.

**Data Import:**
```bash
cd server
npm run import-data
```

This imports the Italy dataset (214,054 records) from the legacy Python application's processed weather data files.

## 🐛 Troubleshooting

### Database Connection Issues

If you can't connect to the database:
1. Ensure Docker is running: `docker ps`
2. Check if PostgreSQL container is up: `docker-compose ps`
3. Restart the database: `docker-compose down && docker-compose up db`

### GraphQL Server Issues

If the GraphQL server won't start:
1. Check if port 4001 is available: `lsof -i :4001`
2. Verify Prisma client is generated: `cd server && npx prisma generate`
3. View server logs: `docker-compose logs graphql-api`

### Frontend Issues

If the React frontend won't start:
1. Check if port 3000 is available: `lsof -i :3000`
2. Verify GraphQL API is running at http://localhost:4001
3. Check environment variables in `client/.env.development`

### Port Already in Use

If ports are already in use, you can change them in `docker-compose.yml`:
- **PostgreSQL (5431)**: Under `db.ports`
- **GraphQL API (4001)**: Under `graphql-api.ports` and `server/.env`
- **Frontend (3000)**: Under `frontend.ports`

## 🐍 Python Data Processing Scripts

The `dataAndUtils/legacy/` directory contains Python scripts for processing raw weather station data and matching it to cities. These scripts are used to prepare the data that gets imported into the PostgreSQL database.

### Setup Python Environment

```bash
cd dataAndUtils/legacy
./setup.sh
```

This will:
- Create a Python virtual environment
- Install required dependencies (pandas, geopy, sqlalchemy, psycopg2)

### Running Data Processing

⚠️ **Important**: The raw weather station data file is not included in this repository due to its large size. The script requires:
- Raw weather station CSV at: `dataAndUtils/uncleaned_data/AVERAGED_weather_station_data_ALL.csv`
- This file must be obtained separately and placed in the correct location

If you have the raw data file:

```bash
# Activate virtual environment
cd dataAndUtils/legacy
source venv/bin/activate

# Run the main processing script
cd utils
python CleanData_MatchCities_ExpandDatesAndWeather.py

# Or specify a custom input file
python CleanData_MatchCities_ExpandDatesAndWeather.py --input-csv /path/to/your/data.csv
```

**For detailed documentation on the Python scripts, see [dataAndUtils/legacy/README.md](dataAndUtils/legacy/README.md)**

### What the Scripts Do

The main script (`CleanData_MatchCities_ExpandDatesAndWeather.py`):
1. Reads historical weather data from weather stations
2. Matches stations to major cities using worldcities.csv (population ≥ 100k)
3. Falls back to Nominatim geocoding for remote/rural stations
4. Processes and cleans weather values (temperatures, precipitation)
5. Outputs data in batches for efficient processing

## 🗂️ Legacy Code

The original Python FastAPI backend has been archived to the `legacy/` directory as of October 27, 2025.

**Migration Reason**: The project has been migrated to a modern TypeScript GraphQL stack for better type safety, modern development practices, and improved developer experience.

**Running the Legacy API**: If you need to run the old Python API for reference, see `legacy/README.md` for instructions.

**Migration Documentation**: For complete migration details, see `MIGRATION_PLAN.md`.

## 📚 Documentation

- **Backend/GraphQL API**: [server/README.md](server/README.md)
- **Frontend/React**: [client/README.md](client/README.md)
- **Legacy Python API**: [legacy/README.md](legacy/README.md)
- **Migration Plan**: [MIGRATION_PLAN.md](MIGRATION_PLAN.md)

## 🔐 Database Configuration

The application uses PostgreSQL with the following default configuration:

- **Host**: localhost
- **Port**: 5431 (mapped from container's 5432)
- **Database**: postgres
- **User**: postgres
- **Password**: iwantsun (configurable in docker-compose.yml)

## 📝 Notes

- The date format in the database is `YYYY-MM-DD` (e.g., `2020-03-15`)
- The API endpoint for dates uses `MMDD` format (e.g., `0315`)
- Weather data is historical and represents averages, not real-time data
- Some weather metrics may be `null` for certain records if data was unavailable

## 🚧 Future Enhancements

Potential improvements for the project:
- Add filtering by date range
- Implement pagination for large result sets
- Add more sophisticated querying (e.g., by temperature range, precipitation levels)
- Expand the dataset to include more global locations
- Add data visualization endpoints
- Implement caching for frequently accessed data
- Add authentication and rate limiting

## 📄 License

This project is licensed under "n" (as specified in pyproject.toml).

## 👤 Author

Ashlen Kurre
