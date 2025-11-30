# Complete Beginner's Guide: Deploy Vaycay to Railway

## 🎯 What This Guide Does

This guide will help you take your Vaycay app (which currently only runs on your computer with Docker) and put it on the internet so anyone can access it at a URL.

**What you'll accomplish:**
- ✅ Your app will be live on the internet 24/7
- ✅ You'll get free Railway URLs (like `frontend-production-xxxx.up.railway.app`)
- ✅ The app will automatically update when you push code to GitHub
- ✅ Your database will be backed up daily
- ✅ **Optional:** Add a custom domain (like `betterthere.app`) to replace the Railway URLs

**What is Railway?**
Railway is a hosting platform that runs your app on their servers. Think of it like renting a computer in the cloud that runs your app 24/7. You pay ~$8-13/month instead of buying and maintaining your own server.

**About URLs:**
- Railway automatically gives you free URLs when you deploy (e.g., `backend-production-xxxx.up.railway.app`)
- These work perfectly fine and you can use them forever
- **Part 6 of this guide** shows you how to add a custom domain (like `betterthere.app`) if you want a more professional URL
- Custom domains are **completely optional** - only do this if you want to

---

## 📋 Prerequisites - What You Need Before Starting

### ✅ Required (Must Have):

1. **GitHub Account with Your Code**
   - Your vaycay_v2 repository must be on GitHub
   - Verify: Run `git remote -v` (should show `https://github.com/akurre/VaycayApp.git`)
   - If not on GitHub: Push your code first with `git push origin main`

2. **Credit Card**
   - For Railway Pro subscription ($5/month minimum)
   - Railway requires payment info even though first $5 is free

3. **Computer with Terminal**
   - Mac: Use Terminal app
   - Windows: Use PowerShell or Command Prompt
   - Linux: Use your terminal

4. **Node.js 18 or higher**
   - Check: `node --version` (should show v18.x.x or higher)
   - If not installed: Download from [nodejs.org](https://nodejs.org)

5. **Git Installed**
   - Check: `git --version`
   - If not installed: Download from [git-scm.com](https://git-scm.com)

### ⏱️ Time Required:
- **First-time setup**: 1-2 hours
- **Future deployments**: Automatic (5-10 minutes)

---

## 💰 Cost Breakdown

**Railway Pricing:**
- **Pro Plan**: $5/month (required)
- **Included Credit**: $5/month (first $5 of usage is free)
- **Actual Usage**: ~$3-8/month for typical traffic
  - Database: ~$2-3/month
  - Backend: ~$1-3/month
  - Frontend: ~$0.50-2/month

**Total Monthly Cost**: ~$8-13/month

**Optional:**
- **Custom Domain**: ~$12/year (Namecheap/Google Domains)

---

## 🚀 Part 1: Initial Railway Setup (~30 minutes)

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** (top right)
3. Click **"Login with GitHub"**
4. Click **"Authorize Railway"** when GitHub asks
5. You'll be redirected to Railway dashboard

**✅ Verify:** You should see Railway dashboard with "New Project" button.

### Step 2: Upgrade to Pro Plan

**Why needed:** Free plan is too limited for production apps.

1. Click your profile picture (top right)
2. Click **"Account Settings"**
3. Click **"Upgrade to Pro"**
4. Enter credit card details
5. Confirm $5/month subscription

**✅ Verify:** You should see "Pro" badge next to your profile.

### Step 3: Install Railway CLI

Open your terminal:

```bash
# install railway cli
npm install -g @railway/cli

# verify installation
railway --version
```

**✅ Expected output:** `railway version 3.x.x`

**Troubleshooting:**
- If "command not found": Close and reopen terminal
- On Mac, you might need: `sudo npm install -g @railway/cli`

### Step 4: Login to Railway CLI

```bash
railway login
```

**What happens:**
1. Browser opens automatically
2. Click **"Confirm"** to authorize
3. See "You're now logged in!" message
4. Close browser, return to terminal

**Verify:**
```bash
railway whoami
```

**✅ Expected output:** Your Railway username

### Step 5: Create Railway Project

```bash
# navigate to your project
cd /path/to/vaycay_v2

# create new railway project
railway init
```

**When prompted:**
- **Project name**: Type `vaycay-production` (or your preferred name)
- **Select**: Choose "Empty Project"

**✅ Verify:** You should see "Project created successfully"

### Step 6: Link Your Project

```bash
# link your local folder to railway project
railway link
```

**When prompted:**
- Select the project you just created (`vaycay-production`)

**✅ Verify:** Run `railway status` - should show your project name

### Step 7: Add PostgreSQL Database

```bash
# add postgresql database to your project
railway add -d postgres
```

**What this does:** Creates a PostgreSQL database in Railway cloud.

**✅ Verify:**
```bash
# link to the postgres service to see its variables
railway service

# when prompted, select "Postgres"
# then check variables
railway variables
```

You should see `DATABASE_URL` and other database connection variables in the output.

---

## 🔧 Part 2: Configure Railway Services (~30 minutes)

**IMPORTANT:** Your app is a monorepo (client and server in one repository). Railway needs to deploy them as separate services.

### Step 1: Open Railway Dashboard

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click your project (`vaycay-production`)
3. You should see the PostgreSQL database already there

### Step 2: Create Backend Service

**What you're doing:** Telling Railway to deploy your `server/` folder as a separate service.

1. Click **"New"** button
2. Select **"GitHub Repo"**
3. If prompted, click **"Configure GitHub App"** and authorize Railway to access your repository
4. Select your repository (`VaycayApp`)
5. Click **"Add Repository"**

**Configure Backend Service:**

After Railway imports your repo:

1. Railway will ask you to configure the service
2. **Service Name**: Type `backend`
3. **Root Directory**: Type `server` (this tells Railway to only deploy the server folder)
4. Click **"Add Service"**

**✅ Verify:** You should see a new "backend" service card in your project.

### Step 3: Configure Backend Settings

Click on the **backend** service card, then:

1. Click **"Settings"** tab
2. Scroll to **"Build"** section
3. **Builder**: Should auto-detect "Dockerfile"
4. **Dockerfile Path**: Should show `Dockerfile`
5. **Root Directory**: Should show `server`
6. **Build Command**: Leave empty (Dockerfile handles this)
7. **Start Command**: Leave empty (Dockerfile handles this)

### Step 4: Configure Backend Environment Variables

Still in the backend service, click **"Variables"** tab.

Click **"+ New Variable"** and add each of these:

```bash
# Node environment
NODE_ENV=production

# Port (Railway will override this, but we set a default)
PORT=4001

# Database URL (this should already be set automatically by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# CORS settings (we'll update these after frontend is deployed)
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

**Note:** The `${{Postgres.DATABASE_URL}}` syntax tells Railway to use the database URL from your PostgreSQL service.

### Step 5: Create Frontend Service

Now we'll add the frontend as a separate service:

1. In your project dashboard, click **"New"** again
2. Select **"GitHub Repo"**
3. Select the same repository (`VaycayApp`)
4. Click **"Add Service"**

**Configure Frontend Service:**

1. **Service Name**: Type `frontend`
2. **Root Directory**: Type `client` (this tells Railway to only deploy the client folder)
3. Click **"Add Service"**

**✅ Verify:** You should now see three services: `Postgres`, `backend`, and `frontend`.

### Step 6: Configure Frontend Settings

Click on the **frontend** service card, then:

1. Click **"Settings"** tab
2. Scroll to **"Build"** section
3. **Builder**: Should auto-detect "Dockerfile"
4. **Dockerfile Path**: Should show `Dockerfile`
5. **Root Directory**: Should show `client`
6. **Build Command**: Leave empty (Dockerfile handles this)
7. **Start Command**: Leave empty (Dockerfile handles this)

### Step 7: Configure Frontend Environment Variables

Click on the **frontend** service card, then **"Variables"** tab.

Add these variables:

```bash
# Node environment
NODE_ENV=production

# API URLs (we'll update these after backend is deployed)
VITE_GRAPHQL_URL=http://localhost:4001/graphql
VITE_API_URL=http://localhost:4001
```

**Note:** We're using `VITE_` prefix because your frontend uses Vite (not Create React App).

---

## 🔐 Part 3: Set Up GitHub Actions (~15 minutes)

GitHub Actions will automatically deploy your app whenever you push code.

### Step 1: Get Railway API Token

1. Go to Railway dashboard
2. Click your profile (top right) → **"Account Settings"**
3. Click **"Tokens"** tab
4. Click **"Create Token"**
5. **Name**: Type `GitHub Actions Production`
6. Click **"Create"**
7. **IMPORTANT:** Copy the token immediately (you won't see it again!)

**✅ Save this token** - you'll need it in the next step.

### Step 2: Get Railway Project ID

You need your Railway Project ID for the deployment workflows.

```bash
railway status
```

Look for the Project ID in the output, or get it from your Railway dashboard URL:
- URL format: `https://railway.com/project/YOUR_PROJECT_ID`
- Example: If URL is `https://railway.com/project/7abaddfd-897a-4e6e-927d-82f09fef75e4`
- Then Project ID is: `7abaddfd-897a-4e6e-927d-82f09fef75e4`

**✅ Save this Project ID** - you'll need it in the next step.

### Step 3: Add GitHub Secrets

1. Go to your GitHub repository: `https://github.com/akurre/VaycayApp`
2. Click **"Settings"** tab
3. Click **"Secrets and variables"** → **"Actions"**
4. Click **"New repository secret"**

**Add the following two secrets:**

**Secret 1: RAILWAY_TOKEN**
- **Name**: `RAILWAY_TOKEN`
- **Secret**: Paste the Railway token you copied in Step 1
- Click **"Add secret"**

**Secret 2: RAILWAY_PROJECT_ID**
- Click **"New repository secret"** again
- **Name**: `RAILWAY_PROJECT_ID`
- **Secret**: Paste your Railway Project ID from Step 2
- Click **"Add secret"**

**✅ Verify:** You should see both `RAILWAY_TOKEN` and `RAILWAY_PROJECT_ID` in your secrets list.

### Step 3: Verify GitHub Actions Workflows

Your repository should already have these workflows in `.github/workflows/`:

1. **ci.yml** - Runs linting and type checking (already exists)
2. **test.yml** - Runs tests (already exists)
3. **deploy-production.yml** - Deploys to Railway (created by this guide)
4. **deploy-staging.yml** - Deploys to staging (optional, created by this guide)
5. **database-backup.yml** - Daily backups (created by this guide)

**Check if deployment workflows exist:**
```bash
ls -la .github/workflows/
```

If you don't see `deploy-production.yml`, `deploy-staging.yml`, and `database-backup.yml`, they were created as part of this guide setup.

### Step 4: Enable GitHub Actions

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. If you see a message about workflows, click **"I understand my workflows, go ahead and enable them"**

**✅ Verify:** You should see your workflows listed.

---

## 🗄️ Part 4: Database Setup (~15 minutes)

### Step 1: Run Initial Prisma Migration

Your database needs to be set up with the correct tables and structure.

```bash
# make sure you're in your project directory
cd /path/to/vaycay_v2

# link to railway (if not already linked)
railway link

# navigate to server directory (where prisma is installed)
cd server

# run prisma migrations on railway database
railway run --service backend npm run prisma:migrate:deploy
```

**What this does:** Creates all your database tables (cities, weather_data, etc.) in the Railway PostgreSQL database.

**✅ Expected output:**
```
Applying migration `20XX...`
Applying migration `20XX...`
...
All migrations have been successfully applied.
```

**If you get an error:**
- Make sure `DATABASE_URL` is set in backend service variables
- Check that PostgreSQL service is running in Railway dashboard
- Try: `railway variables --service backend | grep DATABASE_URL` to verify

### Step 2: Verify Database Schema

```bash
# connect to railway database
railway connect postgres
```

**You're now in the PostgreSQL command line.** Try these commands:

```sql
-- list all tables
\dt

-- describe cities table
\d cities

-- describe weather_data table
\d weather_data

-- exit
\q
```

**✅ Verify:** You should see your tables listed (cities, weather_data, etc.).

### Step 3: Seed Initial Data (If Needed)

**IMPORTANT:** Your app likely has a lot of weather data. You'll need to import it to Railway.

**Option 1: If you have a seed script:**
```bash
# from the server directory
cd server
railway run --service backend npm run seed
```

**Option 2: Import from SQL dump:**

If you have your local database data:

```bash
# 1. Export from local database (from project root)
docker exec postgres-db pg_dump -U postgres postgres > local_data.sql

# 2. Import to Railway
railway run --service backend psql < local_data.sql
```

**Option 3: Run your import scripts:**

If you have data in `dataAndUtils/worldData_v2/`:

```bash
# from the server directory (where package.json has the import script)
cd server
railway run --service backend npm run import:data
```

**Note:** Importing large datasets may take time. Monitor with `railway logs --service backend`.

---

## 🚢 Part 5: First Deployment (~20 minutes)

Now we'll deploy your app for the first time!

### Step 1: Commit All Changes

Make sure all your code is committed:

```bash
# check status
git status

# if there are changes, add them
git add .

# commit
git commit -m "feat: configure railway deployment"
```

### Step 2: Push to GitHub

```bash
# push to main branch (this triggers deployment)
git push origin main
```

**What happens next:**
1. GitHub receives your code
2. Your existing CI workflow runs (linting, type checking, tests)
3. If CI passes, the deploy-production workflow starts
4. Railway receives deployment trigger
5. Railway builds Docker containers for backend and frontend
6. Railway starts your services

### Step 3: Monitor Deployment

**Option 1: Watch in GitHub**

1. Go to your GitHub repository
2. Click **"Actions"** tab
3. Click on the running workflow ("Deploy to Railway Production")
4. Watch the deployment progress

**Option 2: Watch in Railway Dashboard**

1. Go to Railway dashboard
2. Click your project
3. Click on **backend** service
4. Click **"Deployments"** tab
5. Watch the build logs

**Option 3: Watch via CLI**

```bash
# watch backend logs
railway logs --service backend --follow

# in another terminal, watch frontend logs
railway logs --service frontend --follow
```

**⏱️ Deployment takes 5-10 minutes** - be patient!

**What to expect:**
- Backend: Builds TypeScript, generates Prisma client, starts server
- Frontend: Builds React app with Vite, creates nginx container

### Step 4: Get Your Railway URLs

After deployment completes, get your service URLs:

```bash
# get backend url
railway domain --service backend

# get frontend url
railway domain --service frontend
```

**Or in Railway Dashboard:**
1. Click **backend** service → **"Settings"** → **"Domains"**
2. Copy the Railway-provided URL (like `backend-production-xxxx.up.railway.app`)
3. Repeat for **frontend** service

**✅ Save these URLs** - you'll need them in the next step.

### Step 5: Update Environment Variables with Real URLs

Now that your services are deployed, update the environment variables with the actual URLs.

**Update Backend Variables:**

1. Railway dashboard → **backend** service → **"Variables"**
2. Find and update these variables:

```bash
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app
CORS_ORIGIN=https://frontend-production-xxxx.up.railway.app
```

(Replace `frontend-production-xxxx.up.railway.app` with your actual frontend URL)

3. Click **"Save"**

**Update Frontend Variables:**

1. Railway dashboard → **frontend** service → **"Variables"**
2. Find and update these variables:

```bash
VITE_GRAPHQL_URL=https://backend-production-xxxx.up.railway.app/graphql
VITE_API_URL=https://backend-production-xxxx.up.railway.app
```

(Replace `backend-production-xxxx.up.railway.app` with your actual backend URL)

3. Click **"Save"**

**IMPORTANT:** After updating variables, Railway will automatically redeploy both services. Wait 5-10 minutes for redeployment.

### Step 6: Verify Deployment

**Test Backend:**
```bash
# test health endpoint (if you have one)
curl https://backend-production-xxxx.up.railway.app/

# test graphql endpoint
curl https://backend-production-xxxx.up.railway.app/graphql
```

**✅ Expected:** Some response (not an error)

**Test Frontend:**

Open your browser and visit your frontend URL:
```
https://frontend-production-xxxx.up.railway.app
```

**✅ Expected:** You should see your Vaycay app loading!

**Test Full Integration:**

1. Open the frontend in your browser
2. Try interacting with the map
3. Click on a city
4. Verify weather data loads

**✅ If everything works:** Congratulations! Your app is live! 🎉

**If something doesn't work:** See the Troubleshooting section below.

---

## 🌐 Part 6: Custom Domain Setup (Optional, ~30 minutes)

### Step 1: Purchase Domain

1. Go to [Namecheap](https://www.namecheap.com) or [Google Domains](https://domains.google)
2. Search for your desired domain (e.g., `betterthere.app`)
3. Purchase domain (~$12/year)
4. Complete registration

### Step 2: Configure Custom Domain in Railway

**For Frontend (Main Domain):**

1. Railway dashboard → **frontend** service → **"Settings"** → **"Domains"**
2. Click **"Custom Domain"**
3. Enter your domain: `betterthere.app`
4. Railway shows DNS records you need to add

**For Backend (API Subdomain):**

1. Railway dashboard → **backend** service → **"Settings"** → **"Domains"**
2. Click **"Custom Domain"**
3. Enter: `api.betterthere.app`
4. Railway shows DNS records you need to add

### Step 3: Update DNS at Domain Registrar

**In Namecheap:**

1. Login → **Domain List** → **Manage**
2. **Advanced DNS** → **Add New Record**
3. Add CNAME records as shown by Railway:

```
Type: CNAME Record
Host: @
Value: frontend-production-xxxx.up.railway.app
TTL: Automatic

Type: CNAME Record
Host: api
Value: backend-production-xxxx.up.railway.app
TTL: Automatic
```

4. Click **"Save All Changes"**

**In Google Domains:**

1. **My domains** → **Manage** → **DNS**
2. **Custom records** → **Manage custom records**
3. Add CNAME records as shown above
4. Click **"Save"**

### Step 4: Wait for DNS Propagation

- DNS changes take 5-60 minutes to propagate
- Check status at [whatsmydns.net](https://www.whatsmydns.net)
- Railway automatically generates SSL certificate once DNS is verified

### Step 5: Update Environment Variables for Custom Domain

**Backend Variables:**
```bash
FRONTEND_URL=https://betterthere.app
CORS_ORIGIN=https://betterthere.app
```

**Frontend Variables:**
```bash
VITE_GRAPHQL_URL=https://api.betterthere.app/graphql
VITE_API_URL=https://api.betterthere.app
```

Railway will automatically redeploy after you update variables.

### Step 6: Verify Custom Domain

Visit `https://betterthere.app` - you should see:
- ✅ Your app loads
- ✅ Green padlock (SSL certificate)
- ✅ All features work

---

## 🔄 Part 7: Making Changes & Redeploying

### How Automatic Deployment Works

Once set up, deployment is automatic:

1. **You make changes locally** → Edit code on your computer
2. **Commit changes** → `git add .` and `git commit -m "your message"`
3. **Push to GitHub** → `git push origin main`
4. **GitHub Actions triggers** → CI runs (linting, tests)
5. **If CI passes** → Deploy workflow runs
6. **Railway deploys** → New version goes live in 5-10 minutes

**That's it!** No manual deployment needed.

### Making Database Schema Changes

If you need to change your database structure:

**Step 1: Update Prisma Schema**

Edit `server/prisma/schema.prisma`:

```prisma
model City {
  id          String   @id @default(cuid())
  name        String
  country     String
  newField    String?  // ← new field added
  // ... other fields
}
```

**Step 2: Create Migration Locally**

```bash
cd server

# create migration
npx prisma migrate dev --name add_new_field

# test locally
npm run dev
```

**Step 3: Test Locally**

```bash
# verify migration works
npx prisma studio

# run tests
cd ../client
npm test
```

**Step 4: Deploy to Production**

```bash
# commit changes
git add .
git commit -m "feat: add new field to city model"

# push (triggers automatic deployment)
git push origin main
```

**What happens:**
1. GitHub Actions runs CI (linting, tests)
2. If CI passes, deploy workflow runs
3. Railway deploys new code
4. Migration runs automatically: `npx prisma migrate deploy`
5. Services restart with new schema

**✅ Verify migration:**
```bash
cd server
railway run --service backend npx prisma migrate status
```

---

## 💾 Part 8: Database Backups

### Automated Daily Backups

The `database-backup.yml` workflow runs daily at 2 AM UTC automatically.

**What it does:**
1. Connects to your Railway database
2. Creates a SQL dump using `pg_dump`
3. Compresses it with gzip
4. Uploads to GitHub Artifacts (kept for 30 days)
5. Optionally uploads to AWS S3 (if configured)

### Manual Backup

**Create a backup right now:**

```bash
# create backup (can run from any directory)
railway run --service backend bash -c 'pg_dump $DATABASE_URL' > backup.sql

# compress it
gzip backup.sql
```

**✅ You now have:** `backup.sql.gz` file

### Restore from Backup

**If something goes wrong:**

```bash
# 1. download backup (from github artifacts or your computer)

# 2. decompress
gunzip backup.sql.gz

# 3. restore to railway (can run from any directory)
railway run --service backend bash -c 'psql $DATABASE_URL' < backup.sql
```

**⚠️ Warning:** This will overwrite your current database!

---

## 📊 Part 9: Monitoring & Maintenance

### View Logs

**Backend logs:**
```bash
railway logs --service backend

# follow logs in real-time
railway logs --service backend --follow

# filter for errors
railway logs --service backend --filter "error"
```

**Frontend logs:**
```bash
railway logs --service frontend
```

### Check Service Health

**View service status:**
```bash
railway status
```

### Monitor Resource Usage

1. Railway dashboard → Your project → **"Metrics"**
2. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Database size
   - Request count

### Set Up Alerts

1. Railway dashboard → Project → **"Settings"** → **"Notifications"**
2. Configure alerts for:
   - Deployment failures
   - High resource usage
   - Service downtime
   - Budget thresholds

### Database Maintenance

**Check database size:**
```bash
railway connect postgres
```

```sql
-- check database size
SELECT pg_size_pretty(pg_database_size('railway'));

-- optimize database
VACUUM ANALYZE;

-- check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- exit
\q
```

---

## 🔙 Part 10: Rollback & Recovery

### Rollback to Previous Deployment

**If new deployment breaks something:**

```bash
# view deployment history
railway status

# rollback to previous deployment
railway rollback

# or rollback to specific deployment
railway rollback <deployment-id>
```

**Or via GitHub:**
1. Go to GitHub → **Actions**
2. Find the last successful deployment
3. Click **"Re-run all jobs"**

### Emergency Database Restore

**If database gets corrupted:**

```bash
# 1. download latest backup
# (from github artifacts or your backup file)

# 2. stop backend temporarily (optional, for safety)
# railway down --service backend

# 3. restore database (can run from any directory)
railway run --service backend bash -c 'psql $DATABASE_URL' < backup.sql

# 4. verify restoration
cd server
railway run --service backend npx prisma db pull
```

---

## 🐛 Part 11: Troubleshooting

### Deployment Fails

**Check logs:**
```bash
railway logs --service backend
railway logs --service frontend
```

**Common issues:**

1. **Build fails:**
   - Check Dockerfile syntax
   - Verify all dependencies are in package.json
   - Test build locally: `docker build -t test-backend -f server/Dockerfile .`

2. **Environment variables missing:**
   ```bash
   railway variables --service backend
   railway variables --service frontend
   ```

3. **Port conflicts:**
   - Backend should use PORT environment variable
   - Frontend nginx should expose port 80

### Database Connection Fails

**Verify DATABASE_URL:**
```bash
railway variables --service backend | grep DATABASE_URL
```

**Test connection:**
```bash
cd server
railway run --service backend npx prisma db pull
```

**Check database status:**
```bash
railway connect postgres
\conninfo
\q
```

### Frontend Can't Reach Backend

**1. Check CORS settings:**

In `server/src/index.ts`, verify:
```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
```

**2. Verify environment variables:**
```bash
# backend
railway variables --service backend | grep FRONTEND_URL

# frontend
railway variables --service frontend | grep VITE_GRAPHQL_URL
```

**3. Check browser console:**
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests
- Look for CORS errors

**4. Verify URLs match:**
- Frontend should point to backend URL
- Backend should allow frontend URL in CORS

### Migration Fails

**Check migration status:**
```bash
cd server
railway run --service backend npx prisma migrate status
```

**View migration history:**
```bash
cd server
railway run --service backend npx prisma migrate history
```

**Resolve failed migration:**
```bash
cd server
railway run --service backend npx prisma migrate resolve --rolled-back <migration_name>

# then re-run
railway run --service backend npx prisma migrate deploy
```

### "Module not found" Errors

**If you see import errors:**

1. Check that Prisma client is generated:
   ```bash
   cd server
   railway run --service backend npx prisma generate
   ```

2. Verify build completed successfully in logs

3. Check that all dependencies are installed

### Out of Memory Errors

1. Railway dashboard → Service → **"Settings"** → **"Resources"**
2. Increase memory limit (costs more)
3. Or optimize code to use less memory

### SSL Certificate Issues

1. Verify DNS is correctly configured
2. Wait 5-60 minutes for propagation
3. Railway auto-generates certificate once DNS is verified
4. Check Railway dashboard → Service → **"Domains"** for status

---

## 📝 Quick Reference Commands

```bash
# DEPLOYMENT
railway up                                    # deploy current service
railway up --service backend                  # deploy specific service
railway up --detach                          # deploy without watching logs

# LOGS
railway logs --service backend               # view logs
railway logs --service backend --follow      # follow logs
railway logs --service backend --filter error # filter logs

# DATABASE
railway connect postgres                                    # connect to database
cd server && railway run --service backend npx prisma migrate deploy  # run migrations (from server dir)
cd server && railway run --service backend npx prisma studio          # open prisma studio (from server dir)
cd server && railway run --service backend npx prisma generate        # generate prisma client (from server dir)

# ENVIRONMENT
railway variables                            # list all variables
railway variables --service backend          # list service variables
railway variables set KEY=value              # set variable

# STATUS
railway status                               # view project status
railway whoami                               # verify login
railway domain --service backend             # get service url

# ROLLBACK
railway rollback                             # rollback to previous
railway rollback <deployment-id>             # rollback to specific

# BACKUP
railway run --service backend bash -c 'pg_dump $DATABASE_URL' > backup.sql
```

---

## ✅ Complete Deployment Checklist

Use this checklist for your first deployment:

### Pre-Deployment
- [ ] Railway account created and upgraded to Pro
- [ ] Railway CLI installed (`railway --version` works)
- [ ] Logged into Railway CLI (`railway whoami` shows username)
- [ ] Railway project created (`railway init`)
- [ ] Project linked (`railway link`)
- [ ] PostgreSQL database added (`railway add --plugin postgresql`)
- [ ] Backend service created in Railway dashboard with root directory `server`
- [ ] Frontend service created in Railway dashboard with root directory `client`
- [ ] Backend environment variables configured (NODE_ENV, PORT, DATABASE_URL, FRONTEND_URL, CORS_ORIGIN)
- [ ] Frontend environment variables configured (NODE_ENV, VITE_GRAPHQL_URL, VITE_API_URL)
- [ ] Railway API token generated
- [ ] GitHub secret `RAILWAY_TOKEN` added
- [ ] GitHub Actions workflows exist in `.github/workflows/`
- [ ] GitHub Actions enabled in repository

### Initial Deployment
- [ ] Database migrations run (`cd server && railway run --service backend npx prisma migrate deploy`)
- [ ] Database schema verified (`railway connect postgres` → `\dt`)
- [ ] Initial data seeded/imported (if needed)
- [ ] All changes committed (`git status` shows clean)
- [ ] Code pushed to GitHub (`git push origin main`)
- [ ] CI workflow passed (check GitHub Actions)
- [ ] Deploy workflow succeeded (check GitHub Actions)
- [ ] Backend deployed successfully (check Railway dashboard)
- [ ] Frontend deployed successfully (check Railway dashboard)
- [ ] Backend URL obtained (`railway domain --service backend`)
- [ ] Frontend URL obtained (`railway domain --service frontend`)
- [ ] Environment variables updated with real URLs
- [ ] Services redeployed with updated URLs (automatic after variable update)
- [ ] Backend responding (`curl <backend-url>`)
- [ ] Frontend loading correctly (visit frontend URL in browser)
- [ ] Backend and frontend can communicate (test features in app)

### Post-Deployment
- [ ] Custom domain purchased (if applicable)
- [ ] DNS records configured (if applicable)
- [ ] SSL certificate generated (if applicable)
- [ ] Monitoring set up (Railway dashboard → Metrics)
- [ ] Alerts configured (Railway dashboard → Settings → Notifications)
- [ ] Database backup workflow tested (GitHub Actions → Database Backup → Run workflow)
- [ ] Rollback procedure tested (`railway rollback`)
- [ ] Documentation updated with production URLs
- [ ] Team members notified of new URLs

---

## 🎉 Summary

**Complete Workflow:**
1. ✅ Set up Railway account and project
2. ✅ Configure backend and frontend services (separate services for monorepo)
3. ✅ Set up environment variables
4. ✅ Configure GitHub Actions with Railway token
5. ✅ Run database migrations
6. ✅ Push code → automatic deployment
7. ✅ Update URLs in environment variables
8. ✅ App live in ~5-10 minutes

**Costs:**
- $5/month Railway Pro (includes $5 credit)
- ~$3-8/month actual usage
- ~$12/year custom domain (optional)
- **Total: ~$8-13/month**

**Key Benefits:**
- ✅ Automatic deployments on git push
- ✅ Free SSL certificates
- ✅ Automated database backups
- ✅ Easy rollbacks
- ✅ Built-in monitoring
- ✅ Staging environments (optional)
- ✅ Zero-downtime deployments

**Support Resources:**
- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Railway Status: [status.railway.app](https://status.railway.app)

---

## 🚀 Next Steps

After successful deployment:

1. **Test thoroughly**: Verify all features work in production
2. **Set up monitoring**: Configure alerts for errors and downtime
3. **Document URLs**: Update README with production URLs
4. **Share with users**: Your app is live!
5. **Monitor costs**: Check Railway dashboard weekly
6. **Schedule maintenance**: Plan for database optimization

**Your app is now live and automatically deploying! 🎉**
