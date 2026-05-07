# Running `update-missing-populations.ts`

This script reconciles the `cities.population` column against `dataAndUtils/worldcities.csv`. It has two modes:

- **Fill mode** (default): set `population` for cities where it is `null`.
- **Repair mode** (`--repair`): re-verify cities that already have a population and correct or null out wrong values.

Always start with `--dry-run` to preview changes before writing to the DB.

## How it matches

For each city the script tries, in order:

1. **Direct `worldcitiesId` lookup.** If the city already has a `worldcitiesId`, the row in `worldcities.csv` with that id is used directly. No fuzzy matching, no ambiguity.
2. **Fuzzy match** on `name + country + state` (where `state` matches `admin_name` in the CSV), filtered to candidates within 0.3° (~33 km) of the DB coords. The `state` filter is the safety net that prevents Houston, TX from being assigned to Houston, MS.

If neither path returns a match, the city stays `null` (fill mode) or is reset to `null` (repair mode).

## Local: against the Docker DB

The local v2 Postgres runs in `postgres-db-v2` on port `5433`.

```bash
cd server

# preview only
DATABASE_URL=postgresql://postgres:iwantsun@localhost:5433/postgres_v2 \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --dry-run

# fill mode (apply)
DATABASE_URL=postgresql://postgres:iwantsun@localhost:5433/postgres_v2 \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts

# repair mode — preview, then apply
DATABASE_URL=postgresql://postgres:iwantsun@localhost:5433/postgres_v2 \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --repair --dry-run

DATABASE_URL=postgresql://postgres:iwantsun@localhost:5433/postgres_v2 \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --repair
```

## Production: against the Railway DB

The script runs locally and connects over the network to the Railway Postgres. Railway's CLI injects the project's env vars (including `DATABASE_URL`) so the same command works without copying secrets.

### One-time setup

```bash
npm install -g @railway/cli   # if not already installed
railway login
cd <repo root>
railway link                  # pick the Vaycay project + the GraphQL service
```

### Preview (dry-run)

Always do this first. Confirm the corrections look reasonable before applying.

```bash
cd server

# Fill mode: which currently-null populations would get filled?
railway run --service <graphql-service-name> -- \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --dry-run

# Repair mode: which existing populations are wrong and what would they become?
railway run --service <graphql-service-name> -- \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --repair --dry-run
```

`railway run` resolves `DATABASE_URL` from the linked service's variables, so you don't pass it inline.

### Apply

After eyeballing the dry-run output:

```bash
cd server

# Fill
railway run --service <graphql-service-name> -- \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts

# Repair
railway run --service <graphql-service-name> -- \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --repair
```

### Alternative: paste DATABASE_URL directly

If you'd rather not use the CLI, grab the **public** DATABASE_URL from the Railway dashboard (Postgres service → Variables → `DATABASE_PUBLIC_URL`) and run:

```bash
cd server
DATABASE_URL='<paste public url here>' \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --repair --dry-run
```

The internal `DATABASE_URL` only resolves from inside Railway's network — use `DATABASE_PUBLIC_URL` for connections from your laptop.

## Reading the output

**Fill mode summary** ends with:

```
match method breakdown:
  direct id lookup: <n>     ← came from worldcitiesId, most reliable
  fuzzy name+state: <n>     ← came from name+country+state match within 0.3°

fuzzy match distance statistics:
  min/avg/max: <degrees>
```

**Repair mode summary** lists every city whose population would change:

```
Alexandria, Louisiana, United States: worldcities-id match gives 80,129 (was 4,870,000)
Houston, Mississippi, United States: no match found — resetting to null (was 5,464,251)
```

A "no match found — resetting to null" line means the script can't verify the population from `worldcities.csv` (the city is too small to be in the dataset, or coordinates/state don't line up). Null is honest; a wrong number is not.

## Why this script exists

An earlier version of the matching logic filled populations using name-only matching with no country or distance constraint. That dropped Egypt's Alexandria population (4.87M) onto every Alexandria in the US, and Houston, TX's population (5.46M) onto every other Houston worldwide. Repair mode cleans up that legacy bad data; the rewritten matching logic prevents it from coming back.
