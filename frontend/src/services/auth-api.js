/**
 * Auth API service
 * Handles all authentication-related API operations
 * @module services/auth-api
 */

import { rawAxios } from "./http-client";

/**
 * Types from auto-generated API schema
 * @typedef {import('../types/api').UserCreate} UserCreate
 * @typedef {import('../types/api').User} User
 * @typedef {import('../types/api').Token} Token
 */

/**
 * Login user
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Token>}
 */
export async function login(username, password) {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  const response = await rawAxios.post("/auth/token", formData);
  return response.data;
}

/**
 * Register user
 * @param {UserCreate} userData - User registration data (synced with backend)
 * @returns {Promise<User>}
 */
export function register(userData) {
  return rawAxios
    .post("/auth/register", userData)
    .then((r) => r.data);
}

/**
 * Get current user info
 * @returns {Promise<User>}
 */
export function me() {
  return rawAxios
    .get("/auth/me", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
    .then((r) => r.data);
}

/**
 * Logout user
 * @returns {Promise<any>}
 */
export function logout() {
  return rawAxios
    .post(
      "/auth/logout",
      {},
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    )
    .then((r) => r.data);
}
