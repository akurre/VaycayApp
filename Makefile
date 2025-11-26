.PHONY: help install db-setup dev clean db-start db-stop server-dev client-dev check-prereqs lint lint-fix type-check format format-check build prisma delete-package test perf

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Default target - show help
help:
	@echo "$(GREEN)Vaycay v2 - Available Make Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Typical First-Time Setup:$(NC)"
	@echo "  1. make install"
	@echo "  2. make db-setup"
	@echo "  3. make dev"
	@echo ""
	@echo "$(YELLOW)Individual Services:$(NC)"
	@echo "  make server-dev   - Run GraphQL server only"
	@echo "  make client-dev   - Run React client only"
	@echo "  make db-start     - Start PostgreSQL database only"
	@echo "  make db-stop      - Stop PostgreSQL database"
	@echo ""
	@echo "$(YELLOW)Code Quality:$(NC)"
	@echo "  make lint         - Check for ESLint errors in client and server"
	@echo "  make lint-fix     - Auto-fix ESLint errors in client and server"
	@echo "  make format       - Format code with Prettier in client and server"
	@echo "  make format-check - Check code formatting in client and server"
	@echo "  make type-check   - Check for TypeScript errors in client and server"
	@echo "  make test         - Run all tests with coverage"
	@echo "  make build        - Build client and server for production"
	@echo ""
	@echo "$(YELLOW)Utilities:$(NC)"
	@echo "  make prisma         - Generate Prisma client"
	@echo "  make delete-package - Delete root node_modules and package-lock.json, then generate Prisma client"
	@echo "  make perf           - Show performance baseline and monitoring guide"
	@echo "  make clean          - Stop all services and clean up"
	@echo "  make help           - Show this help message"
	@echo ""


# Check for required tools
check-prereqs:
	@echo "$(YELLOW)Checking prerequisites...$(NC)"
	@command -v docker >/dev/null 2>&1 || { echo "$(RED)Error: Docker is not installed$(NC)"; exit 1; }
	@command -v node >/dev/null 2>&1 || { echo "$(RED)Error: Node.js is not installed$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)Error: npm is not installed$(NC)"; exit 1; }
	@echo "$(GREEN)✓ All prerequisites found$(NC)"

# Install all dependencies
install: check-prereqs
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@echo "$(YELLOW)Installing server dependencies...$(NC)"
	cd server && npm install
	@echo "$(YELLOW)Installing client dependencies...$(NC)"
	cd client && npm install
	@echo "$(GREEN)✓ All dependencies installed successfully$(NC)"
	
kill-ports: ## Kill processes on ports 4000 and 5173
	@echo "$(BLUE)Checking for processes on development ports...$(NC)"
	@echo "$(YELLOW)Killing process on port 4001 (server)...$(NC)"
	@lsof -ti:4001 | xargs kill -9 2>/dev/null || echo "$(GREEN)✓ Port 4001 is free$(NC)"
	@echo "$(YELLOW)Killing process on port 5173 (client)...$(NC)"
	@lsof -ti:5173 | xargs kill -9 2>/dev/null || echo "$(GREEN)✓ Port 5173 is free$(NC)"
	@echo "$(GREEN)✓ Ports cleared$(NC)"

# Setup v2 database with new data
db-setup-v2: check-prereqs
	@echo "$(GREEN)Setting up v2 database with new weather data...$(NC)"
	@echo "$(YELLOW)Starting PostgreSQL v2 container...$(NC)"
	docker compose up -d db-v2
	@echo "$(YELLOW)Waiting for database to be ready...$(NC)"
	@sleep 5
	@echo "$(YELLOW)Running Prisma migrations on v2...$(NC)"
	@export DATABASE_URL="postgresql://postgres:iwantsun@localhost:5433/postgres_v2" && cd server && npx prisma migrate reset --force --skip-seed
	@echo "$(YELLOW)Generating Prisma client...$(NC)"
	cd server && npm run prisma:generate
	@echo "$(YELLOW)Importing CSV weather data from worldData_v2 (this will take 30-60 minutes for 7.5M records)...$(NC)"
	@export DATABASE_URL="postgresql://postgres:iwantsun@localhost:5433/postgres_v2" && cd server && npm run import-csv-data
	@echo "$(YELLOW)Merging duplicate cities and consolidating PRCP data (this will take 5-10 minutes)...$(NC)"
	@export DATABASE_URL="postgresql://postgres:iwantsun@localhost:5433/postgres_v2" && cd server && npx tsx scripts/merge-duplicate-cities-optimized.ts
	@echo "$(YELLOW)Reassigning small cities to major cities...$(NC)"
	@export DATABASE_URL="postgresql://postgres:iwantsun@localhost:5433/postgres_v2" && cd server && npx tsx scripts/reassign-cities-to-major-cities.ts
	@echo "$(YELLOW)Importing monthly sunshine hours data...$(NC)"
	@export DATABASE_URL="postgresql://postgres:iwantsun@localhost:5433/postgres_v2" && cd server && npx tsx scripts/import-sunshine-hours.ts
	@echo "$(YELLOW)Aggregating weekly weather data (this will take 2-5 minutes)...$(NC)"
	@export DATABASE_URL="postgresql://postgres:iwantsun@localhost:5433/postgres_v2" && cd server && npm run aggregate-weekly-weather
	@echo "$(GREEN)✓ V2 Database setup complete$(NC)"

# Setup database (temporarily redirected to v2)
db-setup: db-setup-v2

# Start all services for development
dev: check-prereqs
	@echo "$(GREEN)Starting all services...$(NC)"
	@echo "$(YELLOW)Make sure database is running (make db-start if needed)$(NC)"
	@echo "$(YELLOW)Starting GraphQL server...$(NC)"
	@echo "$(YELLOW)Server will be available at: http://localhost:4001$(NC)"
	@cd server && npm run dev &
	@sleep 5
	@echo "$(YELLOW)Starting React client...$(NC)"
	@echo "$(YELLOW)Client will be available at: http://localhost:3000$(NC)"
	@echo ""
	@echo "$(GREEN)All services started!$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop the client, then run 'make clean' to stop all services$(NC)"
	@cd client && npm run dev

# Start database only
db-start: check-prereqs
	@echo "$(GREEN)Starting PostgreSQL database...$(NC)"
	docker compose up -d db
	@echo "$(GREEN)✓ Database started at localhost:5431$(NC)"

# Stop database
db-stop:
	@echo "$(YELLOW)Stopping PostgreSQL database...$(NC)"
	docker compose stop db
	@echo "$(GREEN)✓ Database stopped$(NC)"

# Run server only
server-dev: check-prereqs
	@echo "$(GREEN)Starting GraphQL server...$(NC)"
	@echo "$(YELLOW)Make sure database is running (make db-start)$(NC)"
	@echo "$(YELLOW)Server will be available at: http://localhost:4001$(NC)"
	cd server && npm run dev

# Run client only
client-dev: check-prereqs
	@echo "$(GREEN)Starting React client...$(NC)"
	@echo "$(YELLOW)Make sure server is running (make server-dev)$(NC)"
	@echo "$(YELLOW)Client will be available at: http://localhost:3000$(NC)"
	cd client && npm run dev

# Lint both client and server
lint: check-prereqs
	@echo "$(GREEN)Running code quality checks...$(NC)"
	@echo ""
	@echo "$(YELLOW)Checking code formatting with Prettier...$(NC)"
	@FAILED=0; \
	cd client && npm run format:check || FAILED=1; \
	echo ""; \
	cd ../server && npm run format:check || FAILED=1; \
	if [ $$FAILED -eq 1 ]; then \
		echo ""; \
		echo "$(RED)✗ Formatting issues found. Run 'make format' to fix them.$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(YELLOW)Running ESLint checks...$(NC)"
	@cd client && npm run lint -- --quiet || true
	@echo ""
	@cd server && npm run lint -- --quiet || true
	@echo ""
	@echo "$(GREEN)✓ Lint check complete$(NC)"

# Auto-fix lint errors in both client and server
lint-fix: check-prereqs
	@echo "$(GREEN)Auto-fixing ESLint errors...$(NC)"
	@echo "$(YELLOW)Fixing client...$(NC)"
	@cd client && npm run lint:fix || true
	@echo ""
	@echo "$(YELLOW)Fixing server...$(NC)"
	@cd server && npm run lint:fix || true
	@echo "$(GREEN)✓ Auto-fix complete$(NC)"

# Type check both client and server
type-check: check-prereqs
	@echo "$(GREEN)Running TypeScript type checks...$(NC)"
	@echo "$(YELLOW)Checking client...$(NC)"
	@cd client && npm run type-check || true
	@echo ""
	@echo "$(YELLOW)Checking server...$(NC)"
	@cd server && npm run type-check || true
	@echo "$(GREEN)✓ Type check complete$(NC)"

# Format code with Prettier in both client and server
format: check-prereqs
	@echo "$(GREEN)Formatting code with Prettier...$(NC)"
	@echo "$(YELLOW)Formatting client...$(NC)"
	@cd client && npm run format || true
	@echo ""
	@echo "$(YELLOW)Formatting server...$(NC)"
	@cd server && npm run format || true
	@echo "$(GREEN)✓ Code formatting complete$(NC)"

# Check code formatting in both client and server
format-check: check-prereqs
	@echo "$(GREEN)Checking code formatting...$(NC)"
	@echo "$(YELLOW)Checking client...$(NC)"
	@cd client && npm run format:check || true
	@echo ""
	@echo "$(YELLOW)Checking server...$(NC)"
	@cd server && npm run format:check || true
	@echo "$(GREEN)✓ Format check complete$(NC)"

# Build both client and server for production
build: check-prereqs
	@echo "$(GREEN)Building for production...$(NC)"
	@echo "$(YELLOW)Building server...$(NC)"
	@cd server && npm run build
	@echo ""
	@echo "$(YELLOW)Building client...$(NC)"
	@cd client && npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

# Generate Prisma client
prisma: check-prereqs
	@echo "$(GREEN)Generating Prisma client...$(NC)"
	npm run -w server prisma:generate
	@echo "$(GREEN)✓ Prisma client generated$(NC)"

# Delete root node_modules and package-lock.json, then generate Prisma client
delete-package: check-prereqs
	@echo "$(GREEN)Cleaning up root package files...$(NC)"
	@echo "$(YELLOW)Deleting root node_modules...$(NC)"
	@rm -rf node_modules
	@echo "$(YELLOW)Deleting root package-lock.json...$(NC)"
	@rm -f package-lock.json
	@echo "$(YELLOW)Reinstalling...$(NC)"
	npm i
	@echo "$(YELLOW)Generating Prisma client...$(NC)"
	npm run -w server prisma:generate
	@echo "$(GREEN)✓ Package cleanup and Prisma generation complete$(NC)"

# Run tests
test: check-prereqs
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	@cd client && npm run test:coverage
	@echo "$(GREEN)✓ Tests complete$(NC)"

# Show performance summary
perf:
	@echo "$(GREEN)╔════════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║           Vaycay v2 - Performance Monitoring Guide            ║$(NC)"
	@echo "$(GREEN)╚════════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)📊 Performance Thresholds & Baselines:$(NC)"
	@echo ""
	@grep -A 30 "const thresholds" client/src/utils/performance/performanceMonitor.ts | \
		grep -E "^\s*'[^']+': [0-9]+," | \
		sed "s/.*'\([^']*\)': \([0-9]*\),.*/  ✓ \1: \2ms/" || \
		echo "  ⚠ unable to read thresholds"
	@echo ""
	@echo "$(GREEN)🎯 Real-Time Monitoring (3 ways):$(NC)"
	@echo ""
	@echo "$(YELLOW)1. Visual Dashboard (Recommended):$(NC)"
	@echo "   • make dev"
	@echo "   • Click 'Show Perf' button (bottom-right)"
	@echo "   • Or press Ctrl+Shift+P to toggle"
	@echo "   • Live metrics update every second"
	@echo "   • Color-coded: Green=Good, Red=Over Budget"
	@echo ""
	@echo "$(YELLOW)2. Browser Console (Dev Tools):$(NC)"
	@echo "   • Open browser console (F12)"
	@echo "   • Real-time logs show each operation"
	@echo "   • ✓ = within budget, ⚠️ = over budget"
	@echo ""
	@echo "$(YELLOW)3. Console API (Advanced):$(NC)"
	@echo "   • perfMonitor.logSummary()    - aggregated stats"
	@echo "   • perfMonitor.getBaselines()  - export current metrics"
	@echo "   • perfMonitor.getMetrics()    - raw data array"
	@echo "   • perfMonitor.clear()         - reset all metrics"
	@echo ""
	@echo "$(GREEN)📈 What Gets Tracked:$(NC)"
	@echo "   • Map initial load time"
	@echo "   • Layer creation & rebuilds"
	@echo "   • Color cache computation (temperature & sunshine)"
	@echo "   • Heatmap data transformations"
	@echo "   • requestAnimationFrame performance (home ping animation)"
	@echo "   • All operations logged with ✓ or ⚠️ indicators"
	@echo ""
	@echo "$(GREEN)💡 Quick Start:$(NC)"
	@echo "   make dev → Click 'Show Perf' button → Interact with map"
	@echo ""

# Clean up - stop all services
clean:
	@echo "$(YELLOW)Stopping all services...$(NC)"
	@echo "$(YELLOW)Stopping Node.js processes...$(NC)"
	@-pkill -f "tsx watch src/index.ts" 2>/dev/null || true
	@-pkill -f "vite.*client" 2>/dev/null || true
	@sleep 2
	@echo "$(YELLOW)Stopping Docker containers...$(NC)"
	@docker compose down
	@echo "$(GREEN)✓ All services stopped$(NC)"
