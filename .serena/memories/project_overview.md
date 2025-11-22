# Vaycay v2 Project Overview

## Purpose
Weather data API platform providing historical average weather data for locations worldwide. Enables users to query weather statistics for specific dates or cities to help with vacation planning based on historical weather patterns.

## Tech Stack

### Frontend (React)
- React 19 with TypeScript 5.7
- Vite 6
- Apollo Client 4.0.8
- React Router 6.30
- Tailwind CSS 4.1
- React Leaflet 5.0

### Backend (GraphQL API)
- Apollo Server 4.11
- Nexus 1.3 (code-first GraphQL)
- Prisma 5.22 (ORM)
- TypeScript 5.7
- Node.js 20+

### Infrastructure
- PostgreSQL (Docker)
- Docker & Docker Compose

### Python Data Processing
- Located in dataAndUtils/legacy/
- Python scripts for processing raw weather station data
- Uses pandas, geopy, sqlalchemy, psycopg2

## Project Structure
- `/client` - React frontend
- `/server` - GraphQL API
- `/dataAndUtils/legacy/` - Python data processing scripts
- Workspaces managed via npm workspaces
