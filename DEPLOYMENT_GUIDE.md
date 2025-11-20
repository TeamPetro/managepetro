# 🚀 Complete Deployment Guide for ManagePetro

**Welcome!** This guide will help you deploy the ManagePetro application to production. Don't worry if you're not technical - we'll walk through every single step together.

---

## 📋 Table of Contents

1. [What You Need Before Starting](#what-you-need-before-starting)
2. [Understanding the Application](#understanding-the-application)
3. [Part 1: Deploying the Database](#part-1-deploying-the-database)
4. [Part 2: Deploying the Backend Server](#part-2-deploying-the-backend-server)
5. [Part 3: Deploying the Frontend Server](#part-3-deploying-the-frontend-server)
6. [Part 4: Testing Your Deployment](#part-4-testing-your-deployment)
7. [Part 5: Troubleshooting Common Issues](#part-5-troubleshooting-common-issues)
8. [Getting Help](#getting-help)

---

## What You Need Before Starting

Before we begin, make sure you have:

### 🖥️ **Two Separate Web Servers**

- **Server 1**: For the Backend (the server that does the calculations)
- **Server 2**: For the Frontend (the website users see)
- Both servers need to be able to run programs and connect to the internet

### 🗄️ **A Database**

- You need either:
  - A MySQL database (version 8.0 or higher), OR
  - A PostgreSQL database (version 13 or higher)
- This can be on a third server, or on the same server as your backend

### 🔑 **API Keys** (Free accounts work!)

You'll need to sign up for these services and get free API keys:

1. **Weather API Key**

   - Go to: https://www.weatherapi.com
   - Click "Sign Up"
   - After signing up, find your API key in your dashboard
   - Copy it somewhere safe (like Notepad)

2. **TomTom API Key**

   - Go to: https://developer.tomtom.com
   - Click "Sign Up"
   - After signing up, create a new application
   - Copy your API key somewhere safe

3. **Google Gemini API Key**

   - Go to: https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy it somewhere safe

4. **Google Maps API Key**
   - Go to: https://console.cloud.google.com
   - Create a new project (or select an existing one)
   - Enable the "Maps JavaScript API"
   - Go to "Credentials" and create an API key
   - Copy it somewhere safe

---

## Understanding the Application

ManagePetro has **three main parts**:

1. **Frontend** - The website users interact with (like a store's front window)
2. **Backend** - The server that processes requests and does calculations (like a store's back office)
3. **Database** - Where all the data is stored (like a store's filing cabinet)

These three parts need to talk to each other:

- Frontend talks to Backend
- Backend talks to Database

We'll set up each part in order.

---

## Part 1: Deploying the Database

### Option A: Using PostgreSQL (Recommended for Production)

#### Step 1.1: Set Up PostgreSQL Database

**If you're using a hosting service like Render, Railway, or Supabase:**

1. Log into your database hosting service
2. Click "Create New Database" or "New PostgreSQL Database"
3. Choose a name like `managepetro_db`
4. Wait for it to be created (this might take a few minutes)
5. Find the "Connection Details" or "Connection String"
6. Write down these details:
   - **Database Host** (looks like: `abc123.postgres.database.azure.com`)
   - **Database Port** (usually `5432`)
   - **Database Name** (the name you chose)
   - **Database Username** (usually provided)
   - **Database Password** (usually provided or you set it)

**Example Connection Details:**

```
Host: managepetro-db-123.postgres.database.azure.com
Port: 5432
Database Name: managepetro_db
Username: postgres_user
Password: MySecurePassword123!
```

#### Step 1.2: Initialize Your Database

Now we need to add the tables and structure to your database.

1. On your **Backend Server**, download the application code
2. Find the file `backend/db/schema.sql`
3. You'll need to run this SQL file on your database

**If using a web interface (like pgAdmin or your hosting service's SQL console):**

1. Open the SQL console/query tool
2. Copy the entire contents of `backend/db/schema.sql`
3. Paste it into the SQL console
4. Click "Run" or "Execute"
5. Wait for it to finish (you should see "Success" or similar)

**If using command line:**

```bash
psql -h your-host -U your-username -d your-database-name -f backend/db/schema.sql
```

(Replace `your-host`, `your-username`, and `your-database-name` with your actual details)

---

### Option B: Using MySQL

#### Step 1.1: Set Up MySQL Database

**If you're using a hosting service like PlanetScale, MySQL Cloud, or AWS RDS:**

1. Log into your database hosting service
2. Click "Create New Database" or "New MySQL Database"
3. Choose a name like `manage_petro`
4. Wait for it to be created
5. Find the "Connection Details"
6. Write down these details:
   - **Database Host**
   - **Database Port** (usually `3306`)
   - **Database Name**
   - **Database Username**
   - **Database Password**

#### Step 1.2: Initialize Your Database

1. On your **Backend Server**, download the application code
2. Find the file `backend/db/schema.sql`
3. Run this SQL file on your MySQL database

**If using phpMyAdmin or similar:**

1. Log into phpMyAdmin
2. Select your database from the left sidebar
3. Click the "Import" tab
4. Click "Choose File" and select `backend/db/schema.sql`
5. Click "Go" at the bottom
6. Wait for success message

**If using command line:**

```bash
mysql -h your-host -u your-username -p your-database-name < backend/db/schema.sql
```

(Enter your password when prompted)

---

### 🎯 Special Section: Automatic Database Seeding on Render

**⚠️ READ THIS IF YOU'RE DEPLOYING TO RENDER.COM ⚠️**

Great news! If you're deploying to Render.com using the included `render.yaml` blueprint file, **your database will be initialized automatically**. You don't need to manually run `schema.sql` or `seed.sql`!

#### How It Works

When you deploy to Render using the blueprint:

1. **Before your backend starts**, Render runs `python init_production_db.py`
2. This script checks if your database has tables
3. If **no tables exist**, it runs `backend/db/schema.sql` to create them
4. Then it checks if your database has any data
5. If **no data exists**, it runs `backend/db/seed.sql` to add demo users, stations, trucks, etc.

This happens **automatically every time you deploy**. The script is smart - it won't duplicate data or break existing tables.

#### What Gets Seeded

The `seed.sql` file adds:

- 👤 **Demo users** (for logging in and testing)
- ⛽ **Gas stations** (with locations, fuel levels, capacity)
- 🚚 **Trucks** (with drivers, fuel levels, locations)
- 📦 **Recent delivery records** (for testing the dashboard)
- 🌦️ **Weather data** (for route optimization)

#### Checking If Seeding Worked

After your first deployment to Render:

1. Go to your Render dashboard
2. Click on your **backend service**
3. Click on the **"Logs"** tab
4. Look for these lines in the Pre-Deploy section (before server starts):

**Successful initialization will show:**

```
🚀 MANAGEPETRO DATABASE INITIALIZATION - STARTING
================================================================================
✅ Database connection successful!
📊 Tables found in database: X
📊 Database has data: True/False
```

**If tables needed to be created:**

```
🏗️  CREATING DATABASE SCHEMA
================================================================================
✅ Schema creation completed
✅ Schema creation completed: X successful, Y skipped, Z failed
```

**If data needed to be seeded:**

```
🌱 SEEDING DATABASE WITH INITIAL DATA
================================================================================
✅ Database seeding completed: X successful, Y skipped, Z failed
✅ Data verification successful - database properly seeded
```

**If everything is already set up:**

```
✓ Tables already exist in database. Skipping schema creation.
✓ Data already exists in database. Skipping seeding.
```

**Successful completion:**

```
✅ DATABASE INITIALIZATION COMPLETE (took X.XXs)
================================================================================
```

#### Troubleshooting: "My Production Database is Empty!"

If you deployed but don't see any seeded data:

**Step 1: Check the deployment logs**

1. Go to Render dashboard → Your backend service → Logs
2. Search for "schema.sql" or "seed.sql"
3. Look for error messages

**Step 2: Common issues and fixes**

**Problem:** Logs say "❌ DATABASE_URL environment variable is not set!"

- **Solution:** Set the `DATABASE_URL` environment variable in your Render dashboard
- Go to: Service → Environment → Add Environment Variable
- Use your Supabase connection string (Session Mode pooler recommended)

**Problem:** Logs say "❌ Database connection failed"

- **Solution:** Check that your database is running and accessible
- Verify the DATABASE_URL is correct (copy from Supabase dashboard)
- If using Supabase, try both Session Mode and Direct connection strings
- Check if your Render region can access your database

**Problem:** Logs say "ERROR: relation already exists" or "already exists"

- **Solution:** This is fine! It means tables were already created. The script handles this gracefully.
- Check if data exists by looking for the seeding section in logs

**Problem:** No logs about database initialization at all

- **Solution:** The `render.yaml` file might not be set up correctly. Check that:
  1. Your repository has `render.yaml` file **in the repository root** (not in backend/)
  2. You deployed using "New → Blueprint" (not "New → Web Service")
  3. The render.yaml has `rootDir: ./backend` to run commands from backend folder
  4. The backend service has `preDeployCommand: python init_production_db.py`
  5. Look in the "Pre-Deploy" section of logs (not regular logs)

**Problem:** Schema created but no data after seeding

- **Solution:** This may indicate the seed.sql file has syntax errors or incompatibilities
- Check the logs for specific SQL errors during seeding
- Verify the seed.sql file is PostgreSQL-compatible (not MySQL)

**Step 3: Manual fix - Re-seed the database**

If automatic seeding failed, you can manually run the seed script:

1. In Render dashboard, go to your backend service
2. Click the **"Shell"** tab (this opens a terminal)
3. Run these commands:

```bash
cd /opt/render/project/src
python init_production_db.py
```

4. Check the output for success/error messages

**Step 4: Nuclear option - Reset everything**

If you want to completely wipe and re-create the database:

⚠️ **WARNING: THIS DELETES ALL DATA** ⚠️

1. In Render dashboard, go to your **Database** (not backend service)
2. Click **"Info"** tab
3. Scroll down and click **"Delete Database"**
4. Create a new database with the same name
5. Reconnect it to your backend service
6. Trigger a new deployment (push to GitHub or click "Manual Deploy")
7. The automatic seeding will run on the fresh database

#### Understanding the Initialization Script

The `init_production_db.py` script is located in your `backend/` folder. Here's what it does:

```
┌─────────────────────────────────────┐
│   Render starts your deployment     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  preDeployCommand runs:              │
│  python init_production_db.py        │
└────────────┬────────────────────────┘
             │
             ▼
      ┌──────────────┐
      │ Do tables    │ NO  ┌──────────────────────┐
      │ exist?       ├────►│ Run schema.sql       │
      └──────┬───────┘     │ (Create tables)      │
             │ YES         └──────────────────────┘
             ▼
      ┌──────────────┐
      │ Does data    │ NO  ┌──────────────────────┐
      │ exist?       ├────►│ Run seed.sql         │
      └──────┬───────┘     │ (Add demo data)      │
             │ YES         └──────────────────────┘
             ▼
┌─────────────────────────────────────┐
│    Backend server starts normally    │
└─────────────────────────────────────┘
```

**Key points:**

- ✅ Safe to run multiple times (won't duplicate data)
- ✅ Runs automatically before every deployment
- ✅ Handles PostgreSQL/MySQL differences automatically
- ✅ Logs everything so you can see what happened

#### When to Re-Seed Manually

You might want to manually re-run seeding if:

1. You deleted data from your production database and want it back
2. The `seed.sql` file was updated with new demo data
3. Automatic seeding failed during deployment
4. You want to reset to a "clean slate" for testing

To manually re-seed:

```bash
# In the Render Shell for your backend service:
python init_production_db.py
```

Or you can run the SQL files directly if you have database access:

```bash
psql $DATABASE_URL -f backend/db/seed.sql
```

---

## Part 2: Deploying the Backend Server

The backend is a Python application that needs to run constantly.

### Step 2.1: Prepare Your Backend Server

Log into your backend server using SSH or your hosting provider's terminal.

**Check if Python is installed:**

```bash
python --version
```

or

```bash
python3 --version
```

You need **Python 3.10 or higher**. If you don't have it, install it:

**On Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip
```

**On CentOS/RHEL:**

```bash
sudo yum install python310 python310-pip
```

**On Windows Server:**

1. Download Python from https://www.python.org/downloads/
2. Run the installer
3. **IMPORTANT**: Check "Add Python to PATH" during installation

---

### Step 2.2: Upload the Backend Code

You need to get the backend code onto your server.

**Option A: Using Git (Recommended)**

1. Install git if not already installed:

```bash
# Ubuntu/Debian
sudo apt install git

# CentOS/RHEL
sudo yum install git
```

2. Clone the repository:

```bash
cd /home/your-username
git clone YOUR_REPOSITORY_URL
cd "ISSP Project/backend"
```

**Option B: Upload Files Manually**

1. Use FileZilla, WinSCP, or your hosting provider's file manager
2. Upload the entire `backend` folder to your server
3. Remember where you uploaded it

---

### Step 2.3: Install Backend Dependencies

Navigate to where your backend code is:

```bash
cd /path/to/your/backend
```

Create a virtual environment (this keeps everything organized):

```bash
python3 -m venv venv
```

Activate the virtual environment:

**On Linux/Mac:**

```bash
source venv/bin/activate
```

**On Windows:**

```bash
venv\Scripts\activate
```

You should now see `(venv)` at the beginning of your terminal prompt.

Install all required packages:

```bash
pip install -r requirements.txt
```

This will take a few minutes. Wait for it to complete.

---

### Step 2.4: Configure Backend Environment Variables

Now we need to tell the backend where everything is.

1. Look for a file called `.env.example` in your backend folder
2. Make a copy of it and name it `.env`:

```bash
cp .env.example .env
```

3. Edit the `.env` file:

```bash
nano .env
```

or use any text editor you prefer.

4. Fill in ALL the values. Here's what each one means:

```bash
# =============================================================================
# API KEYS (Required)
# =============================================================================

# Paste your Weather API key here (from weatherapi.com)
WEATHER_API_KEY=paste_your_actual_weather_api_key_here

# Paste your TomTom API key here (from developer.tomtom.com)
TOMTOM_API_KEY=paste_your_actual_tomtom_api_key_here

# Paste your Google Gemini API key here (from makersuite.google.com)
GEMINI_API_KEY=paste_your_actual_gemini_api_key_here

# =============================================================================
# DATABASE CONFIGURATION (Required)
# =============================================================================

# If using PostgreSQL, your values look like:
DB_HOST=your-database-host.postgres.database.com
DB_PORT=5432
DB_NAME=managepetro_db
DB_USER=your_database_username
DB_PASS=your_database_password

# If using MySQL, your values look like:
DB_HOST=your-database-host.mysql.database.com
DB_PORT=3306
DB_NAME=manage_petro
DB_USER=your_database_username
DB_PASS=your_database_password

# =============================================================================
# DATABASE CONNECTION POOLING (Production Settings)
# =============================================================================

# These are good defaults for production:
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
DB_POOL_RECYCLE=3600
DB_POOL_PRE_PING=True
DB_POOL_TIMEOUT=30

# =============================================================================
# JWT SECURITY (Required)
# =============================================================================

# Generate a secure secret key by running this command:
# python -c "import secrets; print(secrets.token_urlsafe(32))"
# Then paste the result here:
JWT_SECRET_KEY=paste_your_generated_secret_key_here

# These can stay as default:
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# =============================================================================
# CORS CONFIGURATION (CRITICAL FOR PRODUCTION)
# =============================================================================

# IMPORTANT: Replace this with your ACTUAL frontend URL
# This tells the backend which websites are allowed to connect to it
#
# If your frontend is at https://managepetro.example.com, put:
CORS_ORIGINS=https://managepetro.example.com
#
# If you have multiple frontend URLs (like production and staging), separate with commas:
# CORS_ORIGINS=https://managepetro.example.com,https://staging.example.com
#
# DO NOT leave this empty or users won't be able to use your app!

# =============================================================================
# OPTIONAL SETTINGS
# =============================================================================

DEFAULT_LLM_MODEL=gemini-2.5-flash
WEATHER_CITY=Vancouver
LOG_LEVEL=INFO
```

**Important Notes:**

- **DO NOT** leave placeholder text like `paste_your_actual_key_here`
- **DO NOT** use quotes around your values
- **DO** replace every placeholder with your actual values
- **DO** save the file when done (in nano, press Ctrl+X, then Y, then Enter)

---

### Step 2.5: Generate Your JWT Secret Key

Open a terminal and run:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

This will output something like: `x7fH_9kM2pL_vN8qR3tW5yZ1aB4cD6eF8gH0iJ2kL4mN6oP8qR0sT2uV4wX6yZ8`

Copy this ENTIRE string and paste it as your `JWT_SECRET_KEY` in the `.env` file.

---

### Step 2.6: Test the Backend

Before making it run permanently, let's test it:

```bash
# Make sure you're in the backend folder and virtual environment is activated
cd /path/to/your/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Run the backend in test mode
uvicorn main:app --host 0.0.0.0 --port 8000
```

You should see output like:

```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Test if it works:**

Open a web browser and go to:

```
http://your-backend-server-ip:8000/docs
```

You should see the API documentation page. If you see this, your backend is working!

Press `Ctrl+C` to stop the test server.

---

### Step 2.7: Make Backend Run Permanently

We need to make the backend run even after you log out of the server.

**Option A: Using Systemd (Linux - Recommended)**

1. Create a service file:

```bash
sudo nano /etc/systemd/system/managepetro-backend.service
```

2. Paste this content (CHANGE THE PATHS to match your setup):

```ini
[Unit]
Description=ManagePetro Backend API
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/backend
Environment="PATH=/path/to/your/backend/venv/bin"
ExecStart=/path/to/your/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**IMPORTANT: Replace these:**

- `your-username` with your actual Linux username
- `/path/to/your/backend` with the actual path (like `/home/john/ISSP Project/backend`)

3. Save and close (Ctrl+X, Y, Enter)

4. Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable managepetro-backend
sudo systemctl start managepetro-backend
```

5. Check if it's running:

```bash
sudo systemctl status managepetro-backend
```

You should see "active (running)" in green.

**To view logs if something goes wrong:**

```bash
sudo journalctl -u managepetro-backend -f
```

---

**Option B: Using PM2 (Works on Linux, Mac, Windows)**

1. Install Node.js and PM2:

**On Ubuntu/Debian:**

```bash
sudo apt install nodejs npm
sudo npm install -g pm2
```

**On Windows:**

- Download Node.js from https://nodejs.org
- Install it
- Open Command Prompt as Administrator:

```bash
npm install -g pm2
```

2. Start the backend with PM2:

```bash
cd /path/to/your/backend
source venv/bin/activate  # Skip on Windows
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name managepetro-backend
```

3. Make it run on startup:

```bash
pm2 startup
pm2 save
```

4. Check if it's running:

```bash
pm2 status
```

**To view logs:**

```bash
pm2 logs managepetro-backend
```

---

### Step 2.8: Set Up a Reverse Proxy (Recommended)

For production, you should use Nginx to:

- Handle HTTPS (secure connections)
- Improve performance
- Add security

**Install Nginx:**

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

**Configure Nginx:**

1. Create a configuration file:

```bash
sudo nano /etc/nginx/sites-available/managepetro-backend
```

2. Paste this configuration (CHANGE YOUR DOMAIN):

```nginx
server {
    listen 80;
    server_name api.your-domain.com;  # CHANGE THIS to your actual domain

    # Increase timeout for AI requests
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/managepetro-backend /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

4. **Set up HTTPS with Let's Encrypt (Free SSL):**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

Follow the prompts. When asked, choose to redirect HTTP to HTTPS.

Now your backend is accessible at: `https://api.your-domain.com`

---

## Part 3: Deploying the Frontend Server

The frontend is a React application that needs to be built and served.

### Step 3.1: Prepare Your Frontend Server

Log into your frontend server.

**Install Node.js:**

**On Ubuntu/Debian:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**On CentOS/RHEL:**

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

**On Windows Server:**

1. Download Node.js from https://nodejs.org
2. Run the installer
3. Restart your computer

**Verify installation:**

```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show 10.x.x or higher
```

---

### Step 3.2: Upload the Frontend Code

**Option A: Using Git**

```bash
cd /home/your-username
git clone YOUR_REPOSITORY_URL
cd "ISSP Project/frontend"
```

**Option B: Upload manually**

Use FileZilla, WinSCP, or your hosting file manager to upload the entire `frontend` folder.

---

### Step 3.3: Configure Frontend Environment Variables

1. Navigate to your frontend folder:

```bash
cd /path/to/your/frontend
```

2. Create your `.env` file:

```bash
cp .env.example .env
```

3. Edit the `.env` file:

```bash
nano .env
```

4. Fill in the values:

```bash
# =============================================================================
# BACKEND API URL (CRITICAL - This tells the frontend where the backend is)
# =============================================================================

# IMPORTANT: Use your ACTUAL backend URL here
# This is the URL where you deployed your backend in Part 2
#
# Examples:
# - If using Nginx with domain: https://api.your-domain.com
# - If using IP directly: http://123.456.789.012:8000
# - If using a platform like Render: https://your-backend.onrender.com
#
VITE_API_BASE_URL=https://api.your-domain.com

# =============================================================================
# GOOGLE MAPS API KEY (Required for map features)
# =============================================================================

# Paste your Google Maps API key here (from console.cloud.google.com)
VITE_GOOGLE_MAPS_API_KEY=paste_your_google_maps_api_key_here

# =============================================================================
# OPTIONAL SETTINGS
# =============================================================================

# Default AI model to use
VITE_DEFAULT_LLM_MODEL=gemini-2.5-flash

# Default depot location for routes
VITE_DEFAULT_DEPOT_LOCATION=Toronto

# API request timeout (2 minutes is good for AI requests)
VITE_API_TIMEOUT=120000

# Set to false for production
VITE_DEV=false
```

**CRITICAL:** Make sure `VITE_API_BASE_URL` points to your actual backend URL from Part 2!

---

### Step 3.4: Install Frontend Dependencies

```bash
cd /path/to/your/frontend
npm install
```

This will take several minutes. You'll see a progress bar. Wait for it to complete.

---

### Step 3.5: Build the Frontend

Now we convert the React code into static files that can be served to users:

```bash
npm run build
```

This will take a few minutes. When done, you'll have a new folder called `dist` with your built application.

---

### Step 3.6: Serve the Frontend

**Option A: Using Nginx (Recommended)**

1. Install Nginx (if not already installed):

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

2. Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/managepetro-frontend
```

3. Paste this configuration (CHANGE YOUR DOMAIN and PATH):

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # CHANGE THIS

    root /path/to/your/frontend/dist;  # CHANGE THIS to your actual path
    index index.html;

    # Gzip compression for better performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

4. Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/managepetro-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

5. Set up HTTPS:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Your frontend is now live at: `https://your-domain.com`

---

**Option B: Using a Static Hosting Service**

If you're using Vercel, Netlify, or similar:

1. **For Vercel:**

   - Go to https://vercel.com
   - Click "Import Project"
   - Connect your Git repository
   - Set the root directory to `frontend`
   - Add your environment variables in the Vercel dashboard
   - Click "Deploy"

2. **For Netlify:**
   - Go to https://netlify.com
   - Drag and drop your `frontend/dist` folder
   - OR connect your Git repository
   - Add environment variables in Settings
   - Deploy

---

## Part 4: Testing Your Deployment

Now let's make sure everything works together!

### Step 4.1: Test Backend Directly

Open your web browser and go to:

```
https://api.your-domain.com/docs
```

You should see the API documentation. This means your backend is working!

### Step 4.2: Test Frontend

Open your web browser and go to:

```
https://your-domain.com
```

You should see the ManagePetro login page.

### Step 4.3: Test the Connection

1. On the login page, try to create a new account:

   - Click "Sign Up" or "Register"
   - Fill in the form
   - Click "Create Account"

2. If you see a success message and can log in, CONGRATULATIONS! Everything is connected and working!

### Step 4.4: Check Browser Console

1. On the frontend website, press `F12` on your keyboard
2. Click the "Console" tab
3. Look for any red error messages
4. Common issues:
   - "CORS error" → Your backend's `CORS_ORIGINS` is wrong. Go back to Part 2, Step 2.4
   - "Failed to fetch" → Your frontend's `VITE_API_BASE_URL` is wrong. Go back to Part 3, Step 3.3
   - "401 Unauthorized" → This is normal on the login page

---

## Part 5: Troubleshooting Common Issues

### Problem: "CORS policy" error in browser

**What it means:** The backend doesn't recognize the frontend's URL.

**Solution:**

1. Go to your backend server
2. Edit the `.env` file:

```bash
cd /path/to/your/backend
nano .env
```

3. Find the line `CORS_ORIGINS=`
4. Make sure it exactly matches your frontend URL:

```bash
CORS_ORIGINS=https://your-frontend-domain.com
```

5. NO trailing slash!
6. Save the file
7. Restart the backend:

```bash
sudo systemctl restart managepetro-backend
```

---

### Problem: "Failed to fetch" or "Network error"

**What it means:** The frontend can't reach the backend.

**Solution:**

1. Go to your frontend server
2. Check the `.env` file:

```bash
cd /path/to/your/frontend
cat .env
```

3. Make sure `VITE_API_BASE_URL` is correct
4. Test if the backend is reachable:

```bash
curl https://api.your-domain.com/docs
```

5. If you changed `.env`, rebuild the frontend:

```bash
npm run build
sudo systemctl restart nginx
```

---

### Problem: Backend keeps crashing

**What it means:** Something in your configuration is wrong.

**Solution:**

1. Check the logs:

```bash
# If using systemd:
sudo journalctl -u managepetro-backend -n 50

# If using PM2:
pm2 logs managepetro-backend
```

2. Common issues in logs:
   - "Can't connect to database" → Check your `DB_HOST`, `DB_USER`, `DB_PASS` in `.env`
   - "Invalid API key" → Check your `WEATHER_API_KEY`, `TOMTOM_API_KEY`, `GEMINI_API_KEY`
   - "Port already in use" → Another program is using port 8000. Change to 8001 in the service file

---

### Problem: Login doesn't work / "Invalid credentials"

**What it means:** Either the account doesn't exist, or the database connection is broken.

**Solution:**

1. Create a test user directly in the database
2. Or check backend logs when you try to login:

```bash
sudo journalctl -u managepetro-backend -f
```

3. Try the login and watch what error appears in the logs

---

### Problem: Production database is empty (Render only)

**What it means:** The automatic seeding didn't run or failed during deployment.

**Solution:**

1. **First, check if you used the Blueprint deployment method:**

   - You MUST deploy using "New → Blueprint" (not "New → Web Service")
   - The `render.yaml` file must be in your repository root
   - Check Render dashboard → Your service → Settings → Build & Deploy
   - Pre-Deploy Command should show: `python init_production_db.py`

2. **Check the deployment logs:**

   - Render dashboard → Your backend service → Logs
   - Look for "schema.sql" or "seed.sql" in the logs
   - Common error messages:
     - "Could not connect to database" → Database isn't running or not connected
     - "relation already exists" → Tables exist but data might be missing
     - "No such file" → `init_production_db.py` or SQL files are missing

3. **Quick fix - Manually run seeding:**

   ```bash
   # In Render Shell (Dashboard → Backend Service → Shell tab):
   cd /opt/render/project/src
   python init_production_db.py
   ```

   - This will check what's missing and add it
   - You'll see output telling you what it did

4. **If tables exist but no data:**

   ```bash
   # Check if tables exist:
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

   # If it returns 0, manually run seed file:
   psql $DATABASE_URL -f backend/db/seed.sql
   ```

5. **Nuclear option - Fresh start:**
   ⚠️ **This deletes everything!**
   - Render dashboard → Your Database → Info tab → Delete Database
   - Create new database (same name)
   - Reconnect to backend service
   - Trigger new deployment (it will auto-seed the fresh database)

---

### Problem: Maps don't show

**What it means:** The Google Maps API key is missing or invalid.

**Solution:**

1. Check your frontend `.env` file has `VITE_GOOGLE_MAPS_API_KEY`
2. Make sure the key is valid at https://console.cloud.google.com
3. Make sure "Maps JavaScript API" is enabled for your project
4. Rebuild the frontend:

```bash
cd /path/to/your/frontend
npm run build
```

---

### Problem: AI features don't work

**What it means:** The AI API key is missing or invalid.

**Solution:**

1. Check backend `.env` file has `GEMINI_API_KEY`
2. Test the key is valid:

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

3. If you see an error, get a new key from https://makersuite.google.com/app/apikey
4. Update the `.env` file
5. Restart backend:

```bash
sudo systemctl restart managepetro-backend
```

---

## Getting Help

If you're still stuck:

1. **Check the logs first:**

   - Backend: `sudo journalctl -u managepetro-backend -n 100`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`
   - Frontend browser: Press F12, check Console tab

2. **Copy the exact error message** - it will help others help you

3. **Document what you tried:**

   - What step were you on?
   - What command did you run?
   - What was the error?
   - What did you try to fix it?

4. **Ask for help** with all the above information

---

## 🎉 You Did It!

If you made it this far and everything is working, congratulations! You successfully deployed a full-stack application with:

- ✅ A working database
- ✅ A backend API server
- ✅ A frontend web application
- ✅ Secure HTTPS connections
- ✅ All the AI features working

That's no small feat! Take a moment to celebrate! 🎊

---

## Quick Reference: Important URLs

After deployment, save these URLs:

- **Frontend (Users go here):** https://your-domain.com
- **Backend API Docs:** https://api.your-domain.com/docs
- **Backend Health Check:** https://api.your-domain.com/health

## Quick Reference: Important Commands

**View backend logs:**

```bash
sudo journalctl -u managepetro-backend -f
```

**Restart backend:**

```bash
sudo systemctl restart managepetro-backend
```

**Restart nginx:**

```bash
sudo systemctl restart nginx
```

**Rebuild frontend after changes:**

```bash
cd /path/to/your/frontend
npm run build
```

**Check if services are running:**

```bash
sudo systemctl status managepetro-backend
sudo systemctl status nginx
```

---

## Updating Your Deployment

When you need to update the code:

**Backend:**

```bash
cd /path/to/your/backend
git pull  # If using git
source venv/bin/activate
pip install -r requirements.txt  # If dependencies changed
sudo systemctl restart managepetro-backend
```

**Frontend:**

```bash
cd /path/to/your/frontend
git pull  # If using git
npm install  # If dependencies changed
npm run build
# No restart needed - Nginx serves the new files automatically
```

---

**Document Version:** 1.0  
**Last Updated:** 2025  
**Application:** ManagePetro Production Deployment
