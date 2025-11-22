# Suggested Commands for Vaycay v2

## Development Workflow

### Starting Development
```bash
make install       # Install all dependencies
make db-setup      # Setup database
make dev           # Start all services
```

### Individual Services
```bash
make server-dev    # Run GraphQL server only
make client-dev    # Run React client only
make db-start      # Start PostgreSQL only
make db-stop       # Stop PostgreSQL
```

### Code Quality
```bash
make lint          # Check for ESLint errors
make lint-fix      # Auto-fix ESLint errors
make format        # Format code with Prettier
make format-check  # Check code formatting
make type-check    # TypeScript type checking
make test          # Run all tests with coverage
```

### Utilities
```bash
make prisma        # Generate Prisma client
make build         # Build for production
make clean         # Stop all services
```

## System Commands (macOS Darwin)
Standard Unix commands work: `git`, `ls`, `cd`, `grep`, `find`, etc.
