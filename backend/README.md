# Backend - Python FastAPI Server

> **📖 New to setup?** Go to the main [README.md](../README.md) in the project root first!

This folder contains the Python server that powers the Manage Petro app.

## Quick Commands (For Daily Use)

**⚠️ Important: Always run these commands FROM the backend folder!**

### Start Everything:

```bash
# 📍 Make sure you're in the backend folder first:
cd backend

# Start database (run once per day):
docker compose up -d

# Start Python server (keep terminal open):
fastapi dev main.py
```

### Check If Things Are Working:

### Run All Backend Tests

```powershell
./run_tests.ps1
```

Or, simply run:

```bash
pytest
```

This will run all tests in the `backend/tests/` folder and show results.

## Key Files

- `main.py` - Main FastAPI application and API routes
- `requirements.txt` - Python dependencies
- `docker-compose.yml` - MySQL database configuration
- `.env` - Your API keys and configuration (create from `.env.example`)
- `config.py` - Centralized configuration management
- `services/` - Business logic and AI integration
- `models/` - Database and API data models
- `db/` - Database schema and seed data

## Database Commands (Run in Backend Folder)

**📍 All commands below must be run from the backend folder!**

```bash
# Start database (daily - run this every morning):
docker compose up -d

# Stop database but keep your data:
docker compose down

# Nuclear option - delete everything and start fresh:
docker compose down -v
docker compose up -d

# Check if database is actually running:
docker ps
# Look for "manage-petro-mysql" in the list

# To access your docker MySQL
docker exec -it manage-petro-mysql mysql -ump_app -pdevpass manage_petro

# To rebuild db after schema and/or seed script change
cd backend
python rebuild_db.py

# To recreate schema on docker after schema changes (on Windows)
Get-Content .\db\schema.sql | docker exec -i manage-petro-mysql mysql -ump_app -pdevpass manage_petro

# To recreate seeded data on docker after schema changes (on Windows)
Get-Content .\db\seed.sql | docker exec -i manage-petro-mysql mysql -ump_app -pdevpass manage_petro
```

## What This Backend Does

When you visit http://localhost:8000/docs you can see all the API endpoints.

**Main features:**

- `/api/stations` - Manages fuel stations
- `/api/trucks` - Handles truck information
- `/api/route/optimize` - AI route planning
- `/api/dispatch/optimize` - Smart truck dispatching
- `/api/weather/{city}` - Gets weather data

## Your API Keys (.env file)

**📍 Location: This must be in the backend folder as `.env`**

Copy from `.env.example` and fill in your keys:

```env
WEATHER_API_KEY=get_from_weatherapi.com
TOMTOM_API_KEY=get_from_developer.tomtom.com
GEMINI_API_KEY=get_from_makersuite.google.com
```

## Production Deployment - CORS Configuration

When deploying the backend and frontend to separate hosting providers (e.g., backend on Railway/Render and frontend on Vercel), you need to configure CORS (Cross-Origin Resource Sharing) to allow your frontend to communicate with the backend.

### Why is this needed?

By default, the backend only allows requests from `localhost` and the production frontend URL hardcoded in the config. If you deploy to:

- Multiple environments (staging, preview, production)
- Dynamic URLs (Vercel preview deployments)
- Different hosting providers

...you'll get CORS errors in the browser console like: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

### Solution 1: Specific Frontend URLs (Recommended)

Set the `CORS_ORIGINS` environment variable in your backend deployment:

```bash
# Single production frontend
CORS_ORIGINS=https://your-frontend.com

# Multiple environments
CORS_ORIGINS=https://prod.example.com,https://staging.example.com,http://localhost:3000
```

### Solution 2: Dynamic URLs (Vercel Previews)

For services like Vercel that generate dynamic preview URLs (e.g., `https://managepetro-abc123.vercel.app`), use a regex pattern:

```bash
# Allow your main production URL + all preview deployments
CORS_ORIGINS=https://manage-petro-frontend.vercel.app
CORS_ORIGIN_REGEX=https://managepetro-.*\.vercel\.app
```

**Security Note:** Be specific with your regex pattern! Don't use `https://.*\.vercel\.app` (too broad) - use your app name prefix to restrict it to only your deployments.

### How to Configure

1. **Find your backend hosting provider's environment variables section**

   - Railway: Settings → Environment Variables
   - Render: Environment → Environment Variables
   - Heroku: Settings → Config Vars

2. **Add the CORS configuration:**

   ```
   Variable: CORS_ORIGINS
   Value: https://your-frontend-url.com
   ```

3. **If using Vercel preview deployments, also add:**

   ```
   Variable: CORS_ORIGIN_REGEX
   Value: https://your-app-name-.*\.vercel\.app
   ```

4. **Redeploy your backend** (most platforms auto-redeploy on env var changes)

### Verifying CORS Configuration

1. Check your backend logs on startup - you should see:

   ```
   INFO: Configuring CORS with X allowed origins
   INFO: CORS origin regex pattern: https://...
   ```

2. Test in your browser's DevTools console on your frontend:

   ```javascript
   fetch("https://your-backend.com/api/health")
     .then((r) => r.json())
     .then(console.log);
   ```

3. If you see CORS errors, check:
   - ✅ Frontend URL exactly matches what's in `CORS_ORIGINS`
   - ✅ Include protocol (`https://`) in the URL
   - ✅ No trailing slash in the URL
   - ✅ Backend was redeployed after env var change

### Common Deployment Scenarios

**Vercel Frontend + Railway Backend:**

```bash
# On Railway backend:
CORS_ORIGINS=https://your-app.vercel.app
CORS_ORIGIN_REGEX=https://your-app-.*\.vercel\.app
```

**Netlify Frontend + Render Backend:**

```bash
# On Render backend:
CORS_ORIGINS=https://your-app.netlify.app,https://staging--your-app.netlify.app
```

**Custom Domain:**

```bash
CORS_ORIGINS=https://app.yourdomain.com
```

## Common Problems & Solutions

### "Database won't connect" or "Connection refused"

**📍 Run these in backend folder:**

```bash
docker compose down
docker compose up -d
docker ps    # Should show manage-petro-mysql running
```

**If still broken:** Check Docker Desktop is running (whale icon)

### "ModuleNotFoundError" or Python errors

**📍 Run in backend folder:**

```bash
pip install -r requirements.txt
```

**If pip not found:** Python wasn't installed with PATH option

### "API key errors" or "Missing environment variables"

1. Check `.env` file exists in backend folder
2. Open it and verify all three API keys are filled in
3. No quotes or extra spaces around the keys
4. Save the file and restart the server

### "Port 8000 already in use"

**Problem:** Another Python server is running
**Solutions:**

- Close other terminals running Python servers
- Restart your computer
- Change port in `main.py` (advanced)

### Server won't start / "I broke everything"

**📍 Nuclear reset (run in backend folder):**

```bash
docker compose down -v    # Delete all data
pip install -r requirements.txt
docker compose up -d       # Start fresh
fastapi dev main.py       # Restart server
```
