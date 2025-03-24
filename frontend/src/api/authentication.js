/**
 * Authentication Service
 * Handles user authentication flows including:
 * - Local username/password login
 * - Azure AD login/registration
 * - User session management
 */
import { API_BASE_URL } from "@/api/common_util";
import { securedFetch } from "./http";
import { pretty_log } from "./common_util";

export const auth = {
  /**
   * Authenticate user with username/password
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<Object>} User data
   */
  async loginUser(username, password) {
    try {
      return await securedFetch(`${API_BASE_URL}/login/`, {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    } catch (error) {
      pretty_log(`Login failed: ${error.message}`, "ERROR");
      throw new Error(error.message || "Authentication failed");
    }
  },

  /**
   * Get current authenticated user profile
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    try {
      return await securedFetch(`${API_BASE_URL}/users/me/`, {
        method: "GET",
      });
    } catch (error) {
      pretty_log("Session check failed", "WARNING");
      throw new Error(error.message || "Session validation failed");
    }
  },

  /**
   * Register new user account
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} Created user data
   */
  async registerUser(userData) {
    try {
      return await securedFetch(`${API_BASE_URL}/register/`, {
        method: "POST",
        body: JSON.stringify(userData),
      });
    } catch (error) {
      pretty_log(`Registration failed: ${error.message}`, "ERROR");
      throw new Error(error.message || "Account creation failed");
    }
  },

  /**
   * Authenticate using Azure AD token
   * @param {string} token - Microsoft identity token
   * @returns {Promise<Object>} User data
   */
  async azureLogin(token) {
    try {
      return await securedFetch(`${API_BASE_URL}/azure/login/`, {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      pretty_log(`Azure login failed: ${error.message}`, "ERROR");
      throw new Error(error.message || "Microsoft authentication failed");
    }
  },

  /**
   * Register new user using Azure AD token
   * @param {string} token - Microsoft identity token
   * @returns {Promise<Object>} Registered user data
   */
  async azureRegister(token) {
    try {
      const data = await securedFetch(`${API_BASE_URL}/azure/register/`, {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      pretty_log("Azure registration successful", "DEBUG");
      return data;
    } catch (error) {
      pretty_log(`Azure registration failed: ${error.message}`, "ERROR");
      throw new Error(error.message || "Microsoft registration failed");
    }
  },
};