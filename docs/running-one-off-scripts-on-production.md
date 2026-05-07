# Running a one-off script against the production database

Use this when you have a script in `server/scripts/` that you want to run **once** against the deployed Railway production database — for example, to add a city, backfill a column, fix bad data, or seed new reference data.

This is the right approach when:
- The script is a one-time operation, not something that needs to run every deploy.
- You want immediate results without pushing code or waiting for CI.
- The script is idempotent (safe to run more than once) — most of ours use `upsert` for this reason.

If the script needs to run on every deploy, add it as a step in [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml) instead.

---

## Worked example: adding San Jose sunshine data

We'll use [`server/scripts/add-city-sunshine.ts`](../server/scripts/add-city-sunshine.ts) as the example. The same steps work for any script in `server/scripts/`.

### 1. Make sure your script is on `master`

The script reads its data from the file itself (the `CITIES_TO_ADD` array), so the version on disk in production must be the version you want to run.

```bash
git checkout master
git pull
git log -1 -- server/scripts/add-city-sunshine.ts
```

If your changes aren't merged yet, merge them first. Railway runs the version of the script that's checked out in the deployed container.

### 2. Install the Railway CLI (one-time setup)

```bash
npm install -g @railway/cli
railway --version
```

You should see a version number. If you already have it installed, skip ahead.

### 3. Log in to Railway

```bash
railway login
```

This opens a browser tab to authenticate with your Railway account. Once you see `Logged in as <your-email>` in the terminal, you're set.

### 4. Link your local repo to the production Railway project

From the repo root:

```bash
cd /Users/ashlenkurre/Documents/GitHub/VaycayApp
railway link
```

The CLI will prompt you to:
1. Pick a workspace (your personal one)
2. Pick a project — choose the **production** Vaycay project
3. Pick an environment — choose `production`

This writes a `.railway` config file locally so subsequent `railway run` commands know which project to target. You only need to do this once per machine.

To confirm what you're linked to:

```bash
railway status
```

Make sure it says `Environment: production` before continuing. **Running a script against the wrong environment is the easiest way to corrupt prod data.**

### 5. Run the script

The script lives in `server/scripts/`, so we run it from the `server/` directory so that `tsx` resolves the relative path correctly:

```bash
cd server
railway run --service=backend npx tsx scripts/add-city-sunshine.ts
```

What this does:
- `railway run` injects the production environment variables (`DATABASE_URL`, etc.) into your local shell
- `--service=backend` picks the right Railway service (the backend has the DB connection string)
- `npx tsx scripts/add-city-sunshine.ts` runs the TypeScript file directly without compiling

You'll see the script's normal console output (the `🌍 Processing N cities...` lines, etc.), but the writes go to the **production** database.

### 6. Verify the data landed

The `add-city-sunshine.ts` script does its own verification step, but it's worth double-checking from another angle. You can open a Prisma Studio session against production:

```bash
railway run --service=backend npx prisma studio
```

Or run a quick read-only query via `psql`:

```bash
railway run --service=backend bash -c 'psql $DATABASE_URL -c "SELECT c.name, c.state, ms.annual FROM \"City\" c JOIN \"MonthlySunshine\" ms ON ms.\"cityId\" = c.id WHERE c.name = '\''San Jose'\'';"'
```

### 7. (Optional) Verify in the live app

Open the deployed frontend and check that San Jose now shows sunshine data. If the response is cached, it may take up to an hour for the cache to refresh — see the caching notes in [`CLAUDE.md`](../CLAUDE.md#caching).

---

## Quick reference

Once you've done the one-time setup (install CLI, login, link), the workflow for any future one-off script is just:

```bash
cd server
railway status                                    # confirm "Environment: production"
railway run --service=backend npx tsx scripts/<your-script>.ts
```

---

## Common pitfalls

- **Running from the wrong directory.** `npx tsx scripts/foo.ts` only works from `server/`. From the repo root, use `npx tsx server/scripts/foo.ts`.
- **Wrong environment linked.** Always `railway status` first. If it shows `staging` or `development`, run `railway environment production` to switch.
- **Stale code.** `railway run` uses your **local** copy of the script, not the deployed one. Make sure your working copy matches what you intend to run, ideally by checking out `master` first.
- **Missing `--service=backend`.** Without this, Railway doesn't know which service's env vars to inject and `DATABASE_URL` will be empty. The script will fail with a Prisma connection error.
- **Forgetting the script isn't idempotent.** Most of ours are (they use `upsert`), but if you write a new script that does `INSERT` or destructive `UPDATE`s, running it twice can duplicate or corrupt data. Always check the script body before re-running.

---

## Related workflows

- **Migrations on every deploy:** see the `Run Database Migrations` step in [`.github/workflows/deploy-production.yml`](../.github/workflows/deploy-production.yml).
- **Database backups:** [`.github/workflows/database-backup.yml`](../.github/workflows/database-backup.yml) uses the same `railway run --service=backend` pattern to dump prod.
- **Local equivalents:** for running scripts against your local Postgres, see the `add-city-sunshine` target in the [`Makefile`](../Makefile).
