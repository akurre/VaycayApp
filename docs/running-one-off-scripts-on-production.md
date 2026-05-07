# Running a one-off script against the production database

Use this when you have a script in `server/scripts/` that you want to run **once** against the deployed Railway production database — for example, to add a city, backfill a column, fix bad data, or seed new reference data.

This is the right approach when:
- The script is a one-time operation, not something that needs to run every deploy.
- You want immediate results without pushing code or waiting for CI.
- The script is idempotent (safe to run more than once) — most of ours use `upsert` for this reason.

If the script needs to run on every deploy, add it as a step in [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml) instead.

---

## One-time setup

### 1. Install the Railway CLI

```bash
npm install -g @railway/cli
railway --version
```

### 2. Log in

```bash
railway login
```

Opens a browser tab. Once you see `Logged in as <your-email>` in the terminal, you're set.

### 3. Link your local repo to the production Railway project

From the repo root:

```bash
cd /Users/ashlenkurre/Documents/GitHub/VaycayApp
railway link
```

The CLI will prompt you to:
1. Pick a workspace (your personal one)
2. Pick a project — choose the **production** Vaycay project
3. Pick an environment — choose `production`

This writes a `.railway` config file locally so subsequent `railway run` commands know which project to target.

To confirm what you're linked to:

```bash
railway status
```

Make sure it says `Environment: production` before continuing. **Running a script against the wrong environment is the easiest way to corrupt prod data.**

---

## Before you run anything

1. **Make sure your script is on `master`.** Railway's `railway run` uses your **local** copy of the script, but the version on disk should match what's been reviewed and merged. The `add-city-sunshine.ts` script in particular reads its data from the file itself (`CITIES_TO_ADD`), so the merged version must be the version you want to run.

   ```bash
   git checkout master
   git pull
   git log -1 -- server/scripts/<your-script>.ts
   ```

2. **Confirm the right environment** with `railway status`. If it shows `staging` or `development`, run `railway environment production`.

3. **Run from `server/`.** All script paths below are relative to the `server/` directory.

---

## Worked example 1: adding city sunshine data

[`server/scripts/add-city-sunshine.ts`](../server/scripts/add-city-sunshine.ts) adds rows to `City` + `MonthlySunshine` based on a `CITIES_TO_ADD` array in the script body. It's idempotent (uses `upsert`).

```bash
cd server
railway run --service=backend npx tsx scripts/add-city-sunshine.ts
```

What this does:
- `railway run` injects the production environment variables (`DATABASE_URL`, etc.) into your local shell.
- `--service=backend` picks the right Railway service (the backend has the DB connection string).
- `npx tsx scripts/add-city-sunshine.ts` runs the TypeScript file directly without compiling.

You'll see the script's normal console output (`🌍 Processing N cities...`, etc.), but the writes go to the **production** database.

### Verify the data landed

The script does its own verification, but it's worth double-checking from another angle:

```bash
# Prisma Studio against prod
railway run --service=backend npx prisma studio

# Or a quick read-only query
railway run --service=backend bash -c 'psql $DATABASE_URL -c "SELECT c.name, c.state, ms.annual FROM \"City\" c JOIN \"MonthlySunshine\" ms ON ms.\"cityId\" = c.id WHERE c.name = '\''San Jose'\'';"'
```

Then open the deployed frontend and confirm the data appears. If the response is cached, it may take up to an hour for the cache to refresh.

---

## Worked example 2: reconciling city populations

[`server/scripts/update-missing-populations.ts`](../server/scripts/update-missing-populations.ts) reconciles `cities.population` against `dataAndUtils/worldcities.csv`. It has two modes and a dry-run flag — **always start with `--dry-run`**.

### Modes

- **Fill mode** (default): set `population` for cities where it is `null`.
- **Repair mode** (`--repair`): re-verify cities that already have a population and correct or null out wrong values.

### How it matches

For each city the script tries, in order:

1. **Direct `worldcitiesId` lookup.** If the city already has a `worldcitiesId`, the row in `worldcities.csv` with that id is used directly.
2. **Fuzzy match** on `name + country + state` (where `state` matches `admin_name` in the CSV), filtered to candidates within 0.3° (~33 km) of the DB coords. The `state` filter prevents Houston, TX from being assigned to Houston, MS.

If neither path returns a match, the city stays `null` (fill mode) or is reset to `null` (repair mode).

### Run against production

```bash
cd server

# Fill mode — preview, then apply
railway run --service=backend -- \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --dry-run

railway run --service=backend -- \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts

# Repair mode — preview, then apply
railway run --service=backend -- \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --repair --dry-run

railway run --service=backend -- \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --repair
```

### Reading the output

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

### Why this script exists

An earlier matching logic filled populations using name-only matching with no country or distance constraint. That dropped Egypt's Alexandria population (4.87M) onto every Alexandria in the US, and Houston, TX's population (5.46M) onto every other Houston worldwide. Repair mode cleans up that legacy bad data; the rewritten matching logic prevents it from coming back.

### Local equivalent (against the Docker DB)

The local v2 Postgres runs in `postgres-db-v2` on port `5433`. Same flags, just point at the local DB:

```bash
cd server
DATABASE_URL=postgresql://postgres:iwantsun@localhost:5433/postgres_v2 \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --dry-run
```

Drop `--dry-run` to apply, add `--repair` for repair mode.

---

## Quick reference

After the one-time setup, the workflow for any future one-off script is:

```bash
cd server
railway status                                    # confirm "Environment: production"
railway run --service=backend npx tsx scripts/<your-script>.ts
```

Use `npx ts-node --project tsconfig.json …` instead of `npx tsx` if the script needs the project's `tsconfig` (e.g. `update-missing-populations.ts`).

---

## Alternative: paste DATABASE_URL directly

If you'd rather not use the CLI, grab the **public** URL from the Railway dashboard (Postgres service → Variables → `DATABASE_PUBLIC_URL`) and run:

```bash
cd server
DATABASE_URL='<paste public url here>' \
  npx ts-node --project tsconfig.json scripts/update-missing-populations.ts --repair --dry-run
```

The internal `DATABASE_URL` only resolves from inside Railway's network — use `DATABASE_PUBLIC_URL` for connections from your laptop.

---

## Common pitfalls

- **Running from the wrong directory.** `npx tsx scripts/foo.ts` only works from `server/`. From the repo root, use `npx tsx server/scripts/foo.ts`.
- **Wrong environment linked.** Always `railway status` first. If it shows `staging` or `development`, run `railway environment production` to switch.
- **Stale code.** `railway run` uses your **local** copy of the script, not the deployed one. Make sure your working copy matches what you intend to run, ideally by checking out `master` first.
- **Missing `--service=backend`.** Without this, Railway doesn't know which service's env vars to inject and `DATABASE_URL` will be empty. The script will fail with a Prisma connection error.
- **Skipping `--dry-run` on destructive scripts.** Anything that updates or nulls existing rows (like `update-missing-populations.ts --repair`) should be previewed first.
- **Forgetting the script isn't idempotent.** Most of ours are (they use `upsert`), but if you write a new script that does `INSERT` or destructive `UPDATE`s, running it twice can duplicate or corrupt data. Always check the script body before re-running.

---

## Related workflows

- **Migrations on every deploy:** see the `Run Database Migrations` step in [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml).
- **Database backups:** [`.github/workflows/database-backup.yml`](../.github/workflows/database-backup.yml) uses the same `railway run --service=backend` pattern to dump prod.
- **Local equivalents:** for running scripts against your local Postgres, see the targets in the [`Makefile`](../Makefile).
