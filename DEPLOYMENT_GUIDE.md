# 🚀 ManagePetro - Complete Deployment Guide for Beginners

**Welcome!** This guide will help you set up and run the ManagePetro application on your computer.

---

## 📚 Table of Contents

1. [What You're About to Do](#what-youre-about-to-do)
2. [Part 1: Installing Required Software](#part-1-installing-required-software)
3. [Part 2: Getting the Project Code](#part-2-getting-the-project-code)
4. [Part 3: Getting Your API Keys](#part-3-getting-your-api-keys)
5. [Part 4: Setting Up the Backend](#part-4-setting-up-the-backend)
6. [Part 5: Setting Up the Frontend](#part-5-setting-up-the-frontend)
7. [Part 6: Running the Application](#part-6-running-the-application)
8. [Part 7: Stopping the Application](#part-7-stopping-the-application)
9. [Part 8: Daily Startup Process](#part-8-daily-startup-process)
10. [Common Problems and How to Fix Them](#common-problems-and-how-to-fix-them)

---

## What You're About to Do

Think of this application like a restaurant with three parts:

1. **The Database** (MySQL) - Where all your data is stored (like a filing cabinet)
2. **The Backend** (Python/FastAPI) - The kitchen that processes requests and talks to the database
3. **The Frontend** (React) - The nice interface you see and interact with (like the restaurant's dining room)

All three parts need to be running at the same time for the application to work.

**Time needed:** About 30-45 minutes for first-time setup, then 5 minutes each day after that.

---

## Part 1: Installing Required Software

Think of this like getting all your ingredients before cooking. We need to install four programs on your computer.

### Step 1.1: Install Node.js (JavaScript Runtime)

Node.js lets you run JavaScript code on your computer. The frontend needs this.

**What to do:**

1. Go to https://nodejs.org in your web browser
2. You'll see two green download buttons
3. Click the button on the LEFT side (it says "LTS" - this means Long Term Support)
4. The download will start automatically
5. Once downloaded, double-click the file to install it
6. Click "Next" through all the installation screens
7. ⚠️ **IMPORTANT FOR WINDOWS**: Make sure the box that says "Add to PATH" is checked
8. Click "Install" and wait for it to finish
9. Click "Finish" when done

**How to check it worked:**

1. Open a new terminal window:
   - **Windows**: Press the Windows key, type `powershell`, press Enter
   - **Mac**: Press Cmd+Space, type `terminal`, press Enter
2. Type this exactly and press Enter:
   ```
   node --version
   ```
3. You should see something like `v18.17.0` or similar
4. If you see a version number, it worked! ✅
5. If you see "command not found", restart your computer and try again

---

### Step 1.2: Install Python (Programming Language)

Python is what the backend server uses to run.

**What to do:**

1. Go to https://www.python.org/downloads in your web browser
2. Click the big yellow "Download Python" button
3. Once downloaded, double-click the file to install it
4. ⚠️ **VERY IMPORTANT**: At the bottom of the first screen, check the box that says "Add Python to PATH"
5. Click "Install Now"
6. Wait for installation to complete (this might take a few minutes)
7. Click "Close" when done

**How to check it worked:**

1. Open a NEW terminal window (close the old one if still open)
   - **Windows**: Press Windows key, type `powershell`, press Enter
   - **Mac**: Press Cmd+Space, type `terminal`, press Enter
2. Type this exactly and press Enter:
   ```
   python --version
   ```
3. You should see something like `Python 3.10.5` or higher
4. If you see a version number, it worked! ✅
5. If you see "command not found", restart your computer and try again

---

### Step 1.3: Install Docker Desktop (Container Platform)

Docker is like a virtual computer that runs our database. This makes setup much easier.

**What to do:**

1. Go to https://www.docker.com/products/docker-desktop in your web browser
2. Click the "Download for Windows" or "Download for Mac" button
3. Once downloaded, double-click the file to install it
4. Follow the installation wizard (click "OK" and "Next" through all screens)
5. ⚠️ **IMPORTANT**: When installation finishes, restart your computer
6. After restarting, open Docker Desktop:
   - **Windows**: Press Windows key, type `docker desktop`, press Enter
   - **Mac**: Press Cmd+Space, type `docker`, press Enter
7. Wait for Docker Desktop to start (you'll see a whale icon in your system tray/menu bar)
8. The first time you open it, you might see a tutorial - you can skip it

**How to check it worked:**

1. Make sure Docker Desktop is running (look for the whale icon)
2. Open a new terminal window
3. Type this exactly and press Enter:
   ```
   docker --version
   ```
4. You should see something like `Docker version 24.0.0`
5. If you see a version number, it worked! ✅

---

### Step 1.4: Install Git (Version Control)

Git helps you download and manage the project code.

**What to do:**

1. Go to https://git-scm.com/downloads in your web browser
2. Click the download button for your operating system (Windows/Mac)
3. Once downloaded, double-click the file to install it
4. Click "Next" through all the installation screens (the defaults are fine)
5. Click "Install" and wait for it to finish
6. Click "Finish" when done

**How to check it worked:**

1. Open a new terminal window
2. Type this exactly and press Enter:
   ```
   git --version
   ```
3. You should see something like `git version 2.40.0`
4. If you see a version number, it worked! ✅

---

**🎉 Checkpoint:** If all four programs show a version number, you're ready to move on!

---

## Part 2: Getting the Project Code

Now we need to download the project code from GitHub to your computer.

### Step 2.1: Choose Where to Put the Project

**What to do:**

1. Decide where you want to keep the project
   - **Suggestion for Windows**: `C:\Users\YourName\Documents\Projects`
   - **Suggestion for Mac**: `/Users/YourName/Documents/Projects`
2. Create a folder called "Projects" if you don't have one yet:
   - Open File Explorer (Windows) or Finder (Mac)
   - Go to your Documents folder
   - Right-click, select "New Folder"
   - Name it "Projects"

### Step 2.2: Download the Project

**What to do:**

1. Open a new terminal window
2. Navigate to your Projects folder by typing this (replace YourName with your actual username):

   **Windows:**

   ```
   cd C:\Users\YourName\Documents\Projects
   ```

   **Mac:**

   ```
   cd /Users/YourName/Documents/Projects
   ```

3. Press Enter
4. Now download the project by typing:
   ```
   git clone https://github.com/your-organization/ISSP-Project.git
   ```
   ⚠️ **Note**: Replace the URL above with the actual GitHub URL of your project
5. Press Enter and wait for the download to complete
6. You'll see messages showing the download progress
7. When it's done, you'll see "done" at the end

### Step 2.3: Go Into the Project Folder

**What to do:**

1. In the same terminal, type:
   ```
   cd "ISSP Project"
   ```
2. Press Enter
3. You're now inside the project folder!

**How to check it worked:**

1. Type this to see the project contents:
   ```
   ls
   ```
   or on Windows PowerShell:
   ```
   dir
   ```
2. You should see folders named `backend` and `frontend`
3. If you see these folders, you're in the right place! ✅

---

## Part 3: Getting Your API Keys

The application needs to connect to some external services (for weather, maps, and AI). You need to sign up and get free API keys.

Think of API keys like special passwords that let your app talk to these services.

### Step 3.1: Get a Weather API Key

**What to do:**

1. Go to https://www.weatherapi.com in your web browser
2. Look for a "Sign Up" or "Get Started Free" button and click it
3. Fill in the sign-up form:
   - Enter your email address
   - Create a password
   - Enter your name
4. Click "Sign Up" or "Register"
5. Check your email for a confirmation email and click the link inside
6. Log in to WeatherAPI.com
7. You should see your dashboard
8. Look for a section called "API Key" - it's a long string of letters and numbers
9. Click the "Copy" button next to it (or manually select it and copy it)
10. **Paste it into a notepad** - you'll need this later!

---

### Step 3.2: Get a TomTom API Key

**What to do:**

1. Go to https://developer.tomtom.com in your web browser
2. Click "Sign Up" or "Get Started" at the top
3. Fill in the registration form:
   - Enter your email address
   - Create a password
   - Fill in your name and company (you can put "Personal" for company)
4. Click "Create Account"
5. Check your email and confirm your account
6. Log in to the TomTom Developer Portal
7. You might be asked to create an app - if so:
   - Click "Create an App" or "New App"
   - Give it a name like "ManagePetro"
   - Click "Create"
8. Look for "Consumer Key" or "API Key" - it's a long string of characters
9. Click "Copy" or manually copy it
10. **Paste it into your notepad** - you'll need this later!

---

### Step 3.3: Get a Google Gemini API Key

**What to do:**

1. Go to https://makersuite.google.com/app/apikey in your web browser
2. You'll need to sign in with a Google account
   - If you don't have one, click "Create account" first
3. After signing in, you'll see "Google AI Studio" or "MakerSuite"
4. Look for a button that says "Create API Key" or "Get API Key"
5. Click it
6. You might need to create a new project first:
   - If asked, click "Create new project"
   - Give it a name like "ManagePetro"
   - Click "Create"
7. Now click "Create API Key"
8. A popup will show your API key - it's a long string starting with "AIza..."
9. Click "Copy" to copy it
10. **Paste it into your notepad** - you'll need this later!

---

### Step 3.4: Generate a JWT Secret Key

This is a special key that keeps your user login sessions secure.

**What to do:**

1. Open a terminal window
2. Type this command exactly:

   **Windows PowerShell:**

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

   **Mac:**

   ```bash
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. Press Enter
4. You'll see a long random string appear - this is your JWT secret
5. **Copy this string and paste it into your notepad** - you'll need it next!

---

**🎉 Checkpoint:** You should now have 4 keys saved in your notepad:

1. Weather API Key
2. TomTom API Key
3. Google Gemini API Key
4. JWT Secret Key

---

## Part 4: Setting Up the Backend

Now we'll set up the backend (the server that handles all the logic).

### Step 4.1: Create the Backend Configuration File

**What to do:**

1. Make sure you're still in the project folder (the terminal should show the path ending in "ISSP Project")
2. Type this command:
   ```
   cd backend
   ```
3. Press Enter - you're now in the backend folder
4. Now we need to create a configuration file by copying a template:

   **Windows:**

   ```powershell
   Copy-Item .env.example .env
   ```

   **Mac:**

   ```bash
   cp .env.example .env
   ```

5. Press Enter
6. This creates a new file called `.env` (with a dot at the start)

---

### Step 4.2: Add Your API Keys to the Configuration File

Now we need to open that file and add your API keys.

**What to do:**

1. Open the file in a text editor:

   **Windows - Using Notepad:**

   ```powershell
   notepad .env
   ```

   **Mac - Using TextEdit:**

   ```bash
   open -a TextEdit .env
   ```

   Or you can use any code editor like VS Code if you have it installed.

2. The file will open - you'll see lots of lines with settings

3. Find these lines near the top (they should be around lines 10-20):

   ```
   WEATHER_API_KEY=your_weather_api_key_here
   TOMTOM_API_KEY=your_tomtom_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Replace the text after the `=` sign with your actual keys:

   - Delete `your_weather_api_key_here` and paste your Weather API key
   - Delete `your_tomtom_api_key_here` and paste your TomTom API key
   - Delete `your_gemini_api_key_here` and paste your Gemini API key

   Example of what it should look like after:

   ```
   WEATHER_API_KEY=abc123def456ghi789
   TOMTOM_API_KEY=xyz987uvw654rst321
   GEMINI_API_KEY=AIzaSyAaBbCcDdEeFfGgHhIiJjKk
   ```

5. Find the JWT secret line (around line 89):

   ```
   JWT_SECRET_KEY=your_jwt_secret_key_here
   ```

6. Replace `your_jwt_secret_key_here` with the JWT secret you generated earlier

7. **IMPORTANT**: Make sure there are:

   - NO quotes around the keys
   - NO spaces before or after the keys
   - NO extra blank lines

8. Save the file:
   - **Windows**: Press Ctrl+S, then close Notepad
   - **Mac**: Press Cmd+S, then close TextEdit

---

### Step 4.3: Install Backend Dependencies

Now we need to install all the Python packages the backend needs.

**What to do:**

1. Make sure you're still in the backend folder (your terminal should show "backend" in the path)
2. Type this command:
   ```
   pip install -r requirements.txt
   ```
3. Press Enter
4. You'll see lots of text scrolling by - this is normal!
5. This will take 2-5 minutes
6. When it's done, you'll see your command prompt again
7. If you see any red "ERROR" messages, don't panic - scroll up and read the very first error

**Common issues:**

- If you see "pip: command not found", try using `pip3` instead of `pip`
- If you see "permission denied", try adding `--user` at the end: `pip install -r requirements.txt --user`

---

**🎉 Checkpoint:** If the installation completed without errors, your backend is configured! ✅

---

## Part 5: Setting Up the Frontend

Now we'll set up the frontend (the visual part you interact with).

### Step 5.1: Go to the Frontend Folder

**What to do:**

1. In your terminal, type:
   ```
   cd ..
   ```
2. Press Enter - this takes you back to the main project folder
3. Now type:
   ```
   cd frontend
   ```
4. Press Enter - you're now in the frontend folder

---

### Step 5.2: Create the Frontend Configuration File

**What to do:**

1. Copy the example configuration file:

   **Windows:**

   ```powershell
   Copy-Item .env.example .env
   ```

   **Mac:**

   ```bash
   cp .env.example .env
   ```

2. Press Enter

---

### Step 5.3: Edit the Frontend Configuration

**What to do:**

1. Open the `.env` file:

   **Windows:**

   ```powershell
   notepad .env
   ```

   **Mac:**

   ```bash
   open -a TextEdit .env
   ```

2. Find this line:

   ```
   VITE_API_BASE_URL=https://your-backend-url
   ```

3. Replace it with:

   ```
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. Find this line:

   ```
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
   ```

5. **Option 1**: If you have a Google Maps API key, paste it here
   **Option 2**: If you don't have one, just leave it as is (some map features might not work)

6. The rest of the settings can stay as they are

7. Save the file and close it

---

### Step 5.4: Install Frontend Dependencies

**What to do:**

1. Make sure you're in the frontend folder
2. Type this command:
   ```
   npm install
   ```
3. Press Enter
4. You'll see lots of text scrolling - this is normal!
5. This might take 3-5 minutes
6. When done, you'll see your command prompt again

---

**🎉 Checkpoint:** Your frontend is now configured! ✅

---

## Part 6: Running the Application

Now comes the exciting part - we're going to start everything up!

**Important**: You need to keep 3 terminal windows open at the same time. Each one runs a different part of the application.

### Step 6.1: Start Docker Desktop

**What to do:**

1. Open Docker Desktop:
   - **Windows**: Press Windows key, type `docker desktop`, press Enter
   - **Mac**: Press Cmd+Space, type `docker`, press Enter
2. Wait for it to fully start (you'll see the whale icon appear in your system tray/menu bar)
3. The whale icon should NOT have any animations or warnings
4. Keep Docker Desktop running - you can minimize the window but don't close it

---

### Step 6.2: Start the Database (Terminal 1)

**What to do:**

1. Open a NEW terminal window (Terminal 1)
2. Navigate to the backend folder:

   **Windows** (replace YourName with your username):

   ```
   cd C:\Users\YourName\Documents\Projects\"ISSP Project"\backend
   ```

   **Mac** (replace YourName with your username):

   ```
   cd /Users/YourName/Documents/Projects/ISSP\ Project/backend
   ```

3. Type this command:
   ```
   docker compose up -d
   ```
4. Press Enter
5. You'll see messages about downloading images (first time only) and creating containers
6. Wait until you see something like: `✔ Container manage-petro-mysql Started`
7. If you see this, the database is running! ✅

**What to look for:**

- ✅ Good: "Container manage-petro-mysql Started" or "Container manage-petro-mysql Running"
- ❌ Bad: "Error" or "failed" - if you see this, check that Docker Desktop is running

---

### Step 6.3: Start the Backend Server (Terminal 2)

**What to do:**

1. Open a NEW terminal window (Terminal 2) - keep Terminal 1 open!
2. Navigate to the backend folder again:

   **Windows**:

   ```
   cd C:\Users\YourName\Documents\Projects\"ISSP Project"\backend
   ```

   **Mac**:

   ```
   cd /Users/YourName/Documents/Projects/ISSP\ Project/backend
   ```

3. Type this command:
   ```
   fastapi dev main.py
   ```
4. Press Enter
5. You'll see several lines of text
6. Wait for the line that says: `Uvicorn running on http://127.0.0.1:8000`
7. ⚠️ **IMPORTANT**: Keep this terminal window open! Don't close it or type anything in it.

**What you'll see:**

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

If you see this, the backend is running! ✅

**Test it:**

1. Open your web browser
2. Go to: http://localhost:8000/docs
3. You should see a page with "FastAPI" at the top and a list of API endpoints
4. If you see this page, everything is working! ✅

---

### Step 6.4: Start the Frontend (Terminal 3)

**What to do:**

1. Open a NEW terminal window (Terminal 3) - keep Terminals 1 and 2 open!
2. Navigate to the frontend folder:

   **Windows**:

   ```
   cd C:\Users\YourName\Documents\Projects\"ISSP Project"\frontend
   ```

   **Mac**:

   ```
   cd /Users/YourName/Documents/Projects/ISSP\ Project/frontend
   ```

3. Type this command:
   ```
   npm run dev
   ```
4. Press Enter
5. You'll see some build messages
6. Wait for lines that say:

   ```
   VITE v... ready in ... ms

   ➜  Local:   http://localhost:3000/
   ➜  Network: use --host to expose
   ```

7. ⚠️ **IMPORTANT**: Keep this terminal window open! Don't close it or type anything in it.

If you see these lines, the frontend is running! ✅

---

### Step 6.5: Access the Application

**What to do:**

1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. In the address bar, type:
   ```
   http://localhost:3000
   ```
3. Press Enter
4. You should see the ManagePetro application load!
5. 🎉 **SUCCESS!** You did it!

**What you should see:**

- A login page or the main application interface
- No error messages
- The page should load within a few seconds

---

## Part 7: Stopping the Application

When you're done working, here's how to properly shut everything down.

### Step 7.1: Stop the Frontend

**What to do:**

1. Go to Terminal 3 (the one running the frontend)
2. Press `Ctrl+C` (hold Control and press C)
3. The terminal will stop showing messages
4. You can now close this terminal window

---

### Step 7.2: Stop the Backend

**What to do:**

1. Go to Terminal 2 (the one running the backend)
2. Press `Ctrl+C` (hold Control and press C)
3. You'll see a message like "Shutting down"
4. Wait for it to finish (a few seconds)
5. You can now close this terminal window

---

### Step 7.3: Stop the Database

**What to do:**

1. Go to Terminal 1 (or open a new terminal in the backend folder)
2. Make sure you're in the backend folder
3. Type this command:
   ```
   docker compose down
   ```
4. Press Enter
5. You'll see messages about stopping and removing containers
6. Wait until you see: `✔ Container manage-petro-mysql Removed`
7. You can now close this terminal window

---

### Step 7.4: (Optional) Close Docker Desktop

**What to do:**

1. You can leave Docker Desktop running (it uses very little resources when idle)
2. Or you can right-click the whale icon and select "Quit Docker Desktop"

---

## Part 8: Daily Startup Process

After you've done the initial setup, this is what you'll do each day to start working.

### Every Day Quick Start (5 minutes)

1. **Start Docker Desktop**

   - Open Docker Desktop
   - Wait for the whale icon to appear (no animations)

2. **Open 3 terminals**

   - Open Terminal 1
   - Open Terminal 2
   - Open Terminal 3

3. **Start the Database** (Terminal 1)

   ```
   cd C:\Users\YourName\Documents\Projects\"ISSP Project"\backend
   docker compose up -d
   ```

   Wait for "Started" message

4. **Start the Backend** (Terminal 2)

   ```
   cd C:\Users\YourName\Documents\Projects\"ISSP Project"\backend
   fastapi dev main.py
   ```

   Wait for "Uvicorn running on..." message

5. **Start the Frontend** (Terminal 3)

   ```
   cd C:\Users\YourName\Documents\Projects\"ISSP Project"\frontend
   npm run dev
   ```

   Wait for "Local: http://localhost:3000/" message

6. **Open your browser**
   - Go to http://localhost:3000
   - Start working!

---

## Common Problems and How to Fix Them

### Problem: "docker: command not found"

**This means:** Docker isn't installed or isn't in your system PATH.

**How to fix:**

1. Check if Docker Desktop is installed
2. Open Docker Desktop and wait for it to fully start
3. Try the command again
4. If still not working, restart your computer
5. If still not working, reinstall Docker Desktop

---

### Problem: "python: command not found" or "pip: command not found"

**This means:** Python isn't installed or isn't in your system PATH.

**How to fix:**

1. Check if Python is installed by looking for it in your programs
2. If not installed, go back to Part 1.2 and install Python
3. Make sure to check "Add to PATH" during installation
4. After installing, restart your computer
5. Try again

---

### Problem: "npm: command not found"

**This means:** Node.js isn't installed or isn't in your system PATH.

**How to fix:**

1. Check if Node.js is installed
2. If not, go back to Part 1.1 and install Node.js
3. Make sure to check "Add to PATH" during installation
4. Restart your computer
5. Try again

---

### Problem: Database won't start - "port 3306 already in use"

**This means:** Something else is using the database port (maybe another MySQL installation).

**How to fix - Option 1 (Easier):**

1. Restart your computer
2. Don't open any database programs
3. Try starting the database again

**How to fix - Option 2:**

1. Stop any other MySQL or database programs running
2. Open Task Manager (Windows) or Activity Monitor (Mac)
3. Look for MySQL processes and end them
4. Try again

---

### Problem: Backend won't start - "port 8000 already in use"

**This means:** Something else is running on port 8000, or you already have the backend running.

**How to fix:**

1. Check if you already have another terminal running the backend
2. If yes, close that terminal (or press Ctrl+C to stop it)
3. Try starting the backend again
4. If still not working, restart your computer

---

### Problem: Frontend won't start - "port 3000 already in use"

**This means:** Something else is running on port 3000, or you already have the frontend running.

**How to fix:**

1. Check if you already have another terminal running the frontend
2. If yes, close that terminal (or press Ctrl+C to stop it)
3. Try starting the frontend again
4. If still not working, it will ask if you want to use a different port - type `y` and press Enter

---

### Problem: API key errors - "Invalid API key" or "Unauthorized"

**This means:** Your API keys aren't configured correctly.

**How to fix:**

1. Open the backend `.env` file (see Part 4.2)
2. Check that all API keys are pasted correctly
3. Make sure there are NO:
   - Quotes around the keys
   - Spaces before or after the keys
   - Extra blank lines
4. Make sure the keys are on the correct lines
5. Save the file
6. Stop the backend (Ctrl+C in Terminal 2)
7. Start the backend again

---

### Problem: Can't find the .env file

**This means:** The file might be hidden, or you're looking in the wrong folder.

**How to fix - Windows:**

1. Open File Explorer
2. Go to View → Options
3. Click the "View" tab
4. Select "Show hidden files, folders, and drives"
5. Click OK
6. Now you should see `.env` files

**How to fix - Mac:**

1. In Finder, press Cmd+Shift+. (period)
2. This shows hidden files
3. Now you should see `.env` files

---

### Problem: Application loads but looks broken or shows errors

**This means:** Either the backend isn't running, or there's a configuration issue.

**How to fix:**

1. Make sure all three parts are running (check all terminals)
2. Open http://localhost:8000/docs - if this doesn't load, the backend isn't running
3. Check the terminal running the backend for error messages
4. Check the terminal running the frontend for error messages
5. Try the "Complete Reset" below

---

### Problem: Nothing works - Complete Reset

**When to use this:** When you're stuck and nothing else works.

**What to do:**

1. Stop everything:

   - Press Ctrl+C in all terminal windows
   - Close all terminals
   - Run: `docker compose down -v` in the backend folder
   - Close Docker Desktop

2. Restart your computer

3. After restart:

   ```
   cd C:\Users\YourName\Documents\Projects\"ISSP Project"\backend
   docker compose up -d
   ```

   Wait for it to finish

4. In a new terminal:

   ```
   cd C:\Users\YourName\Documents\Projects\"ISSP Project"\backend
   pip install -r requirements.txt
   ```

   Wait for it to finish

5. In another new terminal:

   ```
   cd C:\Users\YourName\Documents\Projects\"ISSP Project"\frontend
   npm install
   ```

   Wait for it to finish

6. Now go back to Part 6 and start everything again

---

## Quick Reference Card

**Save this for daily use:**

### Three Terminal Commands You'll Use Every Day:

**Terminal 1 - Database:**

```
cd C:\Users\YourName\Documents\Projects\"ISSP Project"\backend
docker compose up -d
```

**Terminal 2 - Backend:**

```
cd C:\Users\YourName\Documents\Projects\"ISSP Project"\backend
fastapi dev main.py
```

**Terminal 3 - Frontend:**

```
cd C:\Users\YourName\Documents\Projects\"ISSP Project"\frontend
npm run dev
```

**Then open:** http://localhost:3000

---

### To Stop Everything:

1. Ctrl+C in Terminal 3 (frontend)
2. Ctrl+C in Terminal 2 (backend)
3. In Terminal 1: `docker compose down`

---

## Important URLs

- **Application:** http://localhost:3000
- **Backend API Docs:** http://localhost:8000/docs
- **Backend API:** http://localhost:8000

---

## Getting Help

If you're completely stuck:

1. Take a screenshot of the error message
2. Note which step you're on
3. Write down what command you ran
4. Ask a teammate or your instructor for help

**Include in your help request:**

- What step you're on (e.g., "Part 4.3")
- What you see (copy the error message)
- What you expected to see
- Screenshots if possible

---

## 🎉 Congratulations!

You've successfully deployed the ManagePetro application! This was a lot of steps, but you only have to do the long setup once. After that, it's just three quick commands each day.

**Remember:**

- Keep all three terminals open while working
- Don't close Docker Desktop while the app is running
- Use Ctrl+C to stop terminals
- When in doubt, restart everything

**Happy developing!** 🚀
