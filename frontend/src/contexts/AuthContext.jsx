import { createContext, useState, useEffect } from "react";
import Api from "../services/api";

// Create the context with proper default value
const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Use centralized environment config for API base URL

  // Check if user is authenticated when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await Api.me();
          setUser(userData);
        } catch {
          // Token is invalid or request failed
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await Api.login(username, password);
      const { access_token } = response;

      localStorage.setItem("token", access_token);
      setToken(access_token);

      // Fetch user info
      const userData = await Api.me();
      setUser(userData);

      return { success: true };
    } catch (error) {
      if (error.response && error.response.data) {
        return {
          success: false,
          error:
            error.response.data.detail ||
            "Login failed. Please check your credentials.",
        };
      }
      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          error: "Login timed out. The server may be slow. Please try again.",
        };
      }
      return {
        success: false,
        error: "Unable to connect to server. Please check your connection.",
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      await Api.register({ username, email, password });
      // Auto-login after successful registration
      const loginResult = await login(username, password);
      return loginResult;
    } catch (error) {
      // Handle registration errors specifically
      if (error.response && error.response.data) {
        const detail = error.response.data.detail || "Registration failed";
        // Make error messages more user-friendly
        if (detail.includes("Username already exists")) {
          return {
            success: false,
            error: "This username is already taken. Please choose another.",
          };
        }
        if (detail.includes("Email already registered")) {
          return {
            success: false,
            error:
              "This email is already registered. Please login or use a different email.",
          };
        }
        return { success: false, error: detail };
      }
      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          error:
            "Registration timed out. The server may be slow. Please try again.",
        };
      }
      return {
        success: false,
        error: "Unable to connect to server. Please check your connection.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the context for use in hooks
export { AuthContext };
