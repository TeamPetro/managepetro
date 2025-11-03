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
          error: error.response.data.detail || "Login failed",
        };
      }
      return { success: false, error: "Network error. Please try again." };
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
        return {
          success: false,
          error: error.response.data.detail || "Registration failed",
        };
      }
      return { success: false, error: "Network error. Please try again." };
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
