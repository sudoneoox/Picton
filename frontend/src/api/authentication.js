/**
 * Authentication Service
 * Handles user authentication flows including:
 * - Local username/password login
 * - Azure AD login/registration
 * - User session management
 */
import { API_BASE_URL } from "@/api/common_util";
import { securedFetch } from "./http";
import { pretty_log, getCSRFToken } from "./common_util";

export const auth = {
  /**
   * Authenticate user with username/password
   * @param {string} username 
   * @param {string} password 
   * @returns {Promise<Object>} User data
   */
  async loginUser(personalId, password) {
    pretty_log("Entering loginUser API", "INFO");
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: "POST",
      credentials: "include", // for sessions cookies,
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify({ personalId, password }),
    });
    pretty_log("Received Request inside login_user", "DEBUG");

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    return data;
  },

  /**
   * Get current authenticated user profile
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/users/me/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch user profile");
    }

    return response.json();
  },
  /**
   * Register new user account
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} Created user data
   */
  async registerUser(userData) {
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    return response.json();
  },


  /**
   * Authenticate using Azure AD token
   * @param {string} token - Microsoft identity token
   * @returns {Promise<Object>} User data
   */
  async azureLogin(token) {
    const response = await fetch(`${API_BASE_URL}/azure/login/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Azure login failed");
    }

    return response.json();
  },

  /**
   * Register new user using Azure AD token
   * @param {string} token - Microsoft identity token
   * @returns {Promise<Object>} Registered user data
   */
  async azureRegister(token) {
    try {
      console.log("Sending token to backend:", token.substring(0, 20) + "...");

      const response = await fetch(`${API_BASE_URL}/azure/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      // Log response status
      console.log("Backend registration response status:", response.status);

      const responseText = await response.text();
      console.log("Raw response body:", responseText);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || "Azure registration failed");
        } catch (parseError) {
          throw new Error(`Server error: ${responseText}`);
        }
      }

      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(`Failed to parse response: ${responseText}`);
      }
    } catch (error) {
      console.error("Azure registration error:", error);
      throw error;
    }
  },


  /**
     * Logs out user and clears out cookies and storage cache
  */
  async logout() {
    pretty_log(`Attempting to logout user`, "DEBUG")
    try {
      const response = await fetch(`${API_BASE_URL}/logout/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
      })

      if (response.ok) {
        pretty_log("Logout Successful", "DEBUG")
      } else {
        pretty_log(("Logout Failed"), "ERROR")
      }

    } catch (e) {
      pretty_log(`Error during logout ${e}`, "ERROR")

    }
  },

  /**
   * Update user's email
   * @param {string} email - New email address
   * @returns {Promise<Object>} Response from server
   */
  async updateEmail(email) {
    try {
      const data = await securedFetch(`${API_BASE_URL}/auth/update_email/`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return data;
    } catch (error) {
      pretty_log(`Email update failed: ${error.message}`, "ERROR");
      throw error;
    }
  },

  /**
   * Update user's username
   * @param {string} username - New username
   * @returns {Promise<Object>} Response from server
   */
  async updateUsername(username) {
    try {
      const data = await securedFetch(`${API_BASE_URL}/auth/update_username/`, {
        method: "POST",
        body: JSON.stringify({ username }),
      });
      return data;
    } catch (error) {
      pretty_log(`Username update failed: ${error.message}`, "ERROR");
      throw error;
    }
  },

  /**
   * Update user's password
   * @param {Object} data - Password update data
   * @param {string} data.currentPassword - Current password
   * @param {string} data.newPassword - New password
   * @returns {Promise<Object>} Response from server
   */
  async updatePassword({ currentPassword, newPassword }) {
    try {
      const data = await securedFetch(`${API_BASE_URL}/auth/update_password/`, {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      return data;
    } catch (error) {
      pretty_log(`Password update failed: ${error.message}`, "ERROR");
      throw error;
    }
  },
};
