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

- **Database running?** Visit: http://localhost:8000/docs
- **See API documentation?** You're good to go!
- **Get errors?** See troubleshooting below

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
docker compose down -v     # Delete all data
pip install -r requirements.txt
docker compose up -d       # Start fresh
fastapi dev main.py       # Restart server
```
