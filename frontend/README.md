# ManagePetro Frontend

A modern React application for fuel delivery route optimization and dispatch management, built with Vite, React Query, and Tailwind CSS.

## 🚀 Quick Start

Get the frontend running in under 5 minutes!

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your backend URL and LLM model

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` and you're ready to go!

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0.0 or higher)

  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version` and `npm --version`

- **Backend API** running and accessible
  - The frontend requires a running ManagePetro backend API
  - Default backend URL: `http://localhost:8000`

## 🛠️ Detailed Setup Instructions

### Step 1: Clone and Navigate

```bash
# Navigate to the frontend directory
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:

- React 19 with Vite
- React Query for data fetching
- Axios for API calls
- Tailwind CSS for styling
- ESLint for code quality

### Step 3: Environment Configuration

#### Copy Environment Template

```bash
cp .env.example .env
```

#### Configure Required Variables

Edit the `.env` file with your actual values:

```env
# Base URL for backend API (required)
# This should point to your running ManagePetro backend
VITE_API_BASE_URL=http://localhost:8000

# Default LLM model for route optimization (required)
# Available models: gemini-2.5-flash, gpt-4, etc.
VITE_DEFAULT_LLM_MODEL=gemini-2.5-flash

# Optional: Enable development mode features
VITE_DEV=true
```

#### Environment Variables Explained

| Variable                 | Required | Description                             | Example                 |
| ------------------------ | -------- | --------------------------------------- | ----------------------- |
| `VITE_API_BASE_URL`      | ✅       | Full URL to your backend API            | `http://localhost:8000` |
| `VITE_DEFAULT_LLM_MODEL` | ✅       | Default AI model for route optimization | `gemini-2.5-flash`      |
| `VITE_DEV`               | ❌       | Enable development features             | `true`                  |

**Important Notes:**

- Variables must be prefixed with `VITE_` to be accessible in the frontend
- Never commit your `.env` file to version control
- If these variables are missing, the app will fail to start with clear error messages

### Step 4: Start Development Server

```bash
npm run dev
```

**What happens:**

- Vite development server starts on `http://localhost:3000`
- Hot module replacement (HMR) is enabled for instant updates
- Environment variables are validated on startup
- Proxy to backend API is configured for `/api` routes

**Server Output:**

```
VITE v7.1.7  ready in 614 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

## 🏗️ Build for Production

### Create Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for testing before deployment.

## 📜 Available Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start development server with hot reload |
| `npm run build`   | Create optimized production build        |
| `npm run preview` | Preview production build locally         |
| `npm run lint`    | Run ESLint to check code quality         |

## 🏛️ Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/          # Authentication components
│   │   └── ...            # Other feature components
│   ├── contexts/          # React contexts (Auth, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # API services and utilities
│   ├── config/            # Configuration files
│   ├── constants/         # App constants
│   ├── data/              # Mock data and fixtures
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # App entry point
│   └── index.css          # Global styles
├── .env.example           # Environment template
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS config
├── eslint.config.js       # ESLint configuration
└── package.json           # Dependencies and scripts
```

## 🛠️ Tech Stack

- **Framework:** React 19 with Hooks
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **State Management:** React Query (TanStack Query)
- **HTTP Client:** Axios
- **Routing:** React Router 7
- **Icons:** Heroicons
- **Code Quality:** ESLint

## 🔧 Development Guidelines

### Code Quality

- Run `npm run lint` before committing
- Follow React best practices and hooks patterns
- Use TypeScript-style JSDoc comments for functions
- Keep components small and focused on single responsibilities

### Import Organization

The project uses ESLint to enforce consistent import ordering:

1. **External packages** (e.g., `react`, `axios`)
2. **Internal imports** (e.g., `../components`, `./utils`)

Imports are automatically alphabetized within each group.

**To organize imports:**

```bash
npm run lint
```

### Type Safety & API Synchronization

The frontend uses auto-generated TypeScript types to ensure type safety with the backend API.

#### Generating Types

When the backend API changes (new endpoints, modified request/response structures), regenerate types:

```bash
# Ensure backend is running on http://localhost:8000
npm run generate-types
```

This command:

- Fetches the OpenAPI schema from the backend
- Generates TypeScript interfaces for all API models
- Creates request/response types for each endpoint
- Outputs types to `src/types/api.ts`

#### When to Regenerate Types

⚠️ **Always regenerate types after:**

- Adding/removing API endpoints
- Modifying request/response models in backend (Pydantic models)
- Changing field names, types, or required status
- Before deploying frontend changes that depend on backend updates

#### Using Generated Types

Import and use types in your components:

```javascript
/**
 * @typedef {import('../types/api').RouteRequest} RouteRequest
 * @typedef {import('../types/api').RouteResponse} RouteResponse
 */

/**
 * @param {RouteRequest} data
 * @returns {Promise<RouteResponse>}
 */
async function calculateRoute(data) {
  // TypeScript-aware IDEs will provide autocomplete and validation
  return api.post("/api/routes", data);
}
```

#### CI/CD Integration

Consider adding type generation to your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Generate API Types
  run: |
    npm run generate-types
    git diff --exit-code src/types/api.ts || (echo "Types out of sync!" && exit 1)
```

This ensures types are always synchronized with the backend.

### API Integration

- All API calls go through `src/services/api.js`
- Use React Query hooks from `src/hooks/useApiQueries.js`
- Authentication is handled automatically via interceptors
- Error handling is centralized in API services

### Environment Variables

- Always use `VITE_` prefix for client-side variables
- Validate required variables on app startup
- Never hardcode sensitive values

## 🚨 Troubleshooting

### Common Issues

#### "Missing required environment variable"

```
Missing required environment variable: VITE_API_BASE_URL
Example: VITE_API_BASE_URL=https://your-backend-url
Add this to your .env file in the frontend folder.
```

**Solution:** Ensure your `.env` file exists and contains all required variables.

#### "Failed to connect to backend"

- Verify backend is running on the URL specified in `VITE_API_BASE_URL`
- Check CORS settings in backend
- Ensure backend accepts requests from `http://localhost:3000`

#### "Port 3000 already in use"

```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- --port 3001
```

#### Build fails with ESLint errors

```bash
npm run lint
# Fix the reported issues, then:
npm run build
```

### Development Tips

- Use browser dev tools to inspect network requests
- Check React Query dev tools for cache and request status
- Environment variables are only loaded on server restart
- Clear browser cache if you encounter stale data issues

## 📞 Support

If you encounter issues:

1. Check this README for common solutions
2. Verify your environment setup matches the prerequisites
3. Ensure backend API is running and accessible
4. Check browser console and terminal for error messages

## 🚀 Deployment

For production deployment:

1. Run `npm run build` to create optimized assets
2. Serve the `dist/` directory with any static file server
3. Configure your production environment variables
4. Ensure backend API is accessible from production domain

The app is ready for deployment to services like Vercel, Netlify, or any static hosting platform.
