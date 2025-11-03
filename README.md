# Manage Petro - Quick Start Guide

AI-powered fuel delivery management system with React frontend and Python FastAPI backend.

---

## Prerequisites

Install these before continuing:

1. **Node.js 18+** - https://nodejs.org (includes npm)
2. **Python 3.10+** - https://python.org/downloads
   - ⚠️ **Windows users**: Check "Add Python to PATH" during installation
3. **Docker Desktop** - https://www.docker.com/products/docker-desktop
   - Restart computer after installation
   - Open Docker Desktop and wait for it to start (whale icon appears)

**Verify installation:**

```bash
node --version
python --version
docker --version
```

---

## Setup (First Time Only)

### 1. Get API Keys (Free)

You need three free API keys:

- **Weather API**: https://www.weatherapi.com → Sign up → Get key
- **TomTom Maps**: https://developer.tomtom.com → Sign up → Get key
- **Google Gemini**: https://makersuite.google.com/app/apikey → Sign in → Create key

### 2. Configure Backend

```bash
cd backend

# Copy environment template
# Windows:
copy .env.example .env
# Mac/Linux:
cp .env.example .env

# Edit .env file and paste your API keys:
# WEATHER_API_KEY=your_weather_key_here
# TOMTOM_API_KEY=your_tomtom_key_here
# GEMINI_API_KEY=your_gemini_key_here

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configure Frontend

```bash
cd ../frontend

# Copy environment template
# Windows:
copy .env.example .env
# Mac/Linux:
cp .env.example .env

# Edit .env file (usually the defaults work):
# VITE_API_BASE_URL=http://localhost:8000
# VITE_DEFAULT_LLM_MODEL=gemini-2.5-flash

# Install npm dependencies
npm install
```

---

## Running the App

**You need 3 terminals open simultaneously:**

### Terminal 1: Database (Docker)

```bash
cd backend
docker compose up -d
```

✅ Success: Shows "Container manage-petro-mysql Started"

### Terminal 2: Backend Server

```bash
cd backend
fastapi dev main.py
```

✅ Success: Shows "Uvicorn running on http://127.0.0.1:8000"
⚠️ Keep this terminal open!

### Terminal 3: Frontend App

```bash
cd frontend
npm run dev
```

✅ Success: Shows "Local: http://localhost:3000/"
⚠️ Keep this terminal open!

### Access the App

Open your browser: **http://localhost:3000**

---

## Docker Commands

All Docker commands must be run from the `backend` folder.

```bash
cd backend

# Start database (run every morning)
docker compose up -d

# Stop database (keeps your data)
docker compose down

# Delete everything and start fresh
docker compose down -v
docker compose up -d

# Check if database is running
docker ps
# Look for "manage-petro-mysql" in the list

# Access MySQL console
docker exec -it manage-petro-mysql mysql -ump_app -pdevpass manage_petro

# Rebuild database after schema changes
python rebuild_db.py

# Manual schema reload (Windows PowerShell)
Get-Content .\db\schema.sql | docker exec -i manage-petro-mysql mysql -ump_app -pdevpass manage_petro

# Manual seed data reload (Windows PowerShell)
Get-Content .\db\seed.sql | docker exec -i manage-petro-mysql mysql -ump_app -pdevpass manage_petro
```

---

## Troubleshooting

### Database won't start

```bash
cd backend
docker compose down
docker compose up -d
docker ps  # Verify it's running
```

Make sure Docker Desktop is running (whale icon visible).

### Backend errors

```bash
cd backend
pip install -r requirements.txt
```

### Frontend errors

```bash
cd frontend
npm install
```

### Port already in use

Close other terminals running Python/React servers, or restart your computer.

### API key errors

1. Check `backend/.env` file exists
2. Verify all three API keys are filled in
3. No quotes or extra spaces around keys
4. Restart the backend server

### Complete reset

```bash
cd backend
docker compose down -v
pip install -r requirements.txt
docker compose up -d
fastapi dev main.py

# In another terminal:
cd frontend
npm install
npm run dev
```

---

## Quick Reference

### Important URLs

- **App**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Project Structure

```
├── backend/              # Python FastAPI + MySQL
│   ├── main.py          # API server
│   ├── .env             # Your API keys
│   ├── docker-compose.yml
│   └── requirements.txt
└── frontend/            # React app
    ├── src/
    ├── .env             # Frontend config
    └── package.json
```

### Daily Workflow

**Every morning:**

1. Start Docker Desktop
2. Open 3 terminals
3. Run database, backend, frontend (in that order)
4. Go to http://localhost:3000

**When done working:**

- Close terminals (Ctrl+C)
- Database keeps running in background
- Run `docker compose down` to stop database

---

## GitHub Workflow (Making Changes)

### First Time Setup

```bash
# Clone the project (only do this once)
git clone <repository-url>
cd "ISSP Project"
```

### Every Day Before You Start Working

```bash
# Make sure you're on the main branch
git checkout devmain

# Get the latest changes from your team
git pull origin devmain
```

✅ Success: Shows "Already up to date" or downloads new changes

### Starting a New Feature or Fix

```bash
# Create a new branch for your work
git checkout -b feature/describe-what-youre-doing

# Examples:
# git checkout -b feature/add-login-button
# git checkout -b fix/broken-map-display
```

⚠️ **Branch naming:**

- Use `feature/` for new features
- Use `fix/` for bug fixes
- Keep names short and descriptive

### Saving Your Work

```bash
# Check what you changed
git status

# Add all your changes
git add .

# Save with a message describing what you did
git commit -m "describe your changes here"

# Examples:
# git commit -m "add login button to homepage"
# git commit -m "fix map not loading on stations page"
```

**Commit messages should:**

- Start with a verb (add, fix, update, remove)
- Be short (under 50 characters)
- Describe WHAT you did, not how

### Sharing Your Work (Push to GitHub)

```bash
# Send your branch to GitHub
git push origin feature/your-branch-name

# Example:
# git push origin feature/add-login-button
```

✅ Success: Shows a URL to create a Pull Request

### Creating a Pull Request (PR)

1. Go to GitHub in your browser
2. You'll see a yellow banner saying "Compare & pull request" - click it
3. Fill in:
   - **Title**: What you did (e.g., "Add login button")
   - **Description**: Why and any details
4. Make sure it says: `devmain ← your-branch-name`
5. Click "Create pull request"

⚠️ **DO NOT merge your own PR!** Wait for a team member to review it.

### After Your PR is Merged

```bash
# Switch back to main branch
git checkout devmain

# Get your merged changes
git pull origin devmain

# Delete your old branch (cleanup)
git branch -d feature/your-branch-name
```

### Common Mistakes & Fixes

**"I forgot to create a branch and worked on devmain!"**

```bash
# Create a branch with your current changes
git checkout -b feature/my-forgot-branch

# Your changes are now on the new branch
git push origin feature/my-forgot-branch
```

**"I have merge conflicts!"**

```bash
# Get the latest devmain changes
git checkout devmain
git pull origin devmain

# Try to merge into your branch
git checkout feature/your-branch
git merge devmain

# VS Code will show conflicts - fix them manually
# Then:
git add .
git commit -m "resolve merge conflicts"
git push origin feature/your-branch
```

**"I need to start over!"**

```bash
# Throw away all your changes (BE CAREFUL!)
git checkout devmain
git reset --hard origin/devmain

# Or just switch to devmain and start a new branch
git checkout devmain
git pull origin devmain
git checkout -b feature/new-attempt
```

### Simple Rules

1. ✅ **ALWAYS** work on a branch (never on `devmain` directly)
2. ✅ **ALWAYS** pull before starting new work
3. ✅ **ALWAYS** commit frequently (every hour or when something works)
4. ❌ **NEVER** force push (`git push -f`)
5. ❌ **NEVER** commit directly to `devmain`
6. ❌ **NEVER** merge your own Pull Request
