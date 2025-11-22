# Task Completion Checklist

When completing a coding task, perform these steps:

1. **Format Code**
   ```bash
   make format
   ```

2. **Lint Code**
   ```bash
   make lint-fix
   ```

3. **Type Check**
   ```bash
   make type-check
   ```

4. **Run Tests** (if applicable)
   ```bash
   make test
   ```

5. **Build** (if making significant changes)
   ```bash
   make build
   ```

## Pre-commit Hooks
The project uses Husky + lint-staged, so formatting and linting will run automatically on git commit.
