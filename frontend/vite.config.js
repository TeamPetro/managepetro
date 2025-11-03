import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { REQUIRED_ENV_VARS } from "./src/config/env-config.js";

// Check required env vars at build time
function checkEnvVar(env, varName, example = "") {
  const value = env[varName];
  if (!value || value === "") {
    return { name: varName, example, missing: true };
  }
  return { name: varName, missing: false };
}

export default defineConfig(({ mode }) => {
  // Load environment variables
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), "");

  // Validate all required environment variables
  const missingVars = [];
  REQUIRED_ENV_VARS.forEach(({ name, example }) => {
    const result = checkEnvVar(env, name, example);
    if (result.missing) {
      missingVars.push(result);
    }
  });

  // If any variables are missing, show all of them and exit
  if (missingVars.length > 0) {
    console.error("Missing required environment variables:");
    missingVars.forEach(({ name, example }) => {
      console.error(`  - ${name}`);
      if (example) console.error(`    Example: ${name}=${example}`);
    });
    console.error("Add these to your .env file in the frontend folder.");
    // eslint-disable-next-line no-undef
    process.exit(1);
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: parseInt(env.VITE_DEV_SERVER_PORT || "3000"),
      proxy: {
        "/api": {
          target: env.VITE_DEV_PROXY_TARGET || "http://localhost:8000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
