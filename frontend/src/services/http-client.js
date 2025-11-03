/**
 * HTTP Client Layer
 * Provides axios instance with interceptors and basic HTTP methods
 * @module services/http-client
 */

import axios from "axios";
import { getApiBaseUrl, API_TIMEOUT } from "../config/env";

/**
 * Axios instance configured for the FastAPI backend
 */
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: API_TIMEOUT, // Configurable timeout for long-running route optimization
});

/**
 * Custom API error with optional HTTP status and response data.
 * @typedef {Error & { status?: number, data?: any }} ApiError
 */

// Add auth token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login will be handled by AuthGuard
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Optional error normalization
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      err.message ||
      "Request failed";
    /** @type {ApiError} */
    const wrapped = new Error(message);
    wrapped.status = status;
    wrapped.data = err.response?.data;
    return Promise.reject(wrapped);
  }
);

/**
 * HTTP Client with basic CRUD operations
 */
export const httpClient = {
  /**
   * Perform a GET request.
   * @template T
   * @param {string} url
   * @param {Record<string, any>} [params]
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<T>}
   */
  get: (url, params, config) =>
    api.get(url, { params, ...config }).then((r) => r.data),

  /**
   * Perform a POST request.
   * @template T
   * @param {string} url
   * @param {any} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<T>}
   */
  post: (url, data, config) => api.post(url, data, config).then((r) => r.data),

  /**
   * Perform a PUT request.
   * @template T
   * @param {string} url
   * @param {any} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<T>}
   */
  put: (url, data, config) => api.put(url, data, config).then((r) => r.data),

  /**
   * Perform a PATCH request.
   * @template T
   * @param {string} url
   * @param {any} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<T>}
   */
  patch: (url, data, config) =>
    api.patch(url, data, config).then((r) => r.data),

  /**
   * Perform a DELETE request.
   * @template T
   * @param {string} url
   * @param {import('axios').AxiosRequestConfig} [config]
   * @returns {Promise<T>}
   */
  delete: (url, config) => api.delete(url, config).then((r) => r.data),
};

/**
 * Raw axios instance for auth endpoints that bypass the /api prefix
 */
export const rawAxios = axios;
