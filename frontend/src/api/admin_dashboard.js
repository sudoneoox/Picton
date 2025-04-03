/**
 * Admin Dashboard API Service
 * Handles all admin-specific operations with the backend
 * Uses securedFetch wrapper for CSRF protection and error handling
 */
import { pretty_log, API_BASE_URL } from "@/api/common_util";
import { securedFetch } from "./http";

export const admin = {
  /**
   * Toggle a user's active/inactive status
   * @param {string} userId - UUID of the user to modify
   * @returns {Promise<Object>} Updated user data
   * @throws {Error} If operation fails
   */
  async toggleUserStatus(userId) {
    try {
      // PATCH request to toggle status endpoint
      const data = await securedFetch(
        `${API_BASE_URL}/admin/${userId}/toggle_status/`,
        { method: "PATCH" }
      );
      return data;
    } catch (error) {
      pretty_log(`Toggle status error (${userId}): ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to toggle user status");
    }
  },

  /**
   * Retrieve all system users
   * @returns {Promise<Array>} List of user objects
   * @throws {Error} If fetch fails
   */
  async getUsers() {
    try {
      // GET request to users endpoint
      return await securedFetch(`${API_BASE_URL}/admin/users/`, {
        method: "GET",
      });
    } catch (error) {
      pretty_log(`User fetch error: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to fetch users");
    }
  },

  /**
   * Create a new system user
   * @param {Object} userData - User details for creation
   * @returns {Promise<Object>} Created user data
   * @throws {Error} If creation fails
   */
  async createUser(userData) {
    try {
      // POST request with user data payload
      return await securedFetch(`${API_BASE_URL}/admin/users/`, {
        method: "POST",
        body: JSON.stringify(userData),
      });
    } catch (error) {
      pretty_log(`User creation error: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to create user");
    }
  },

  /**
   * Update existing user details
   * @param {string} userId - UUID of user to update
   * @param {Object} userData - New user data fields
   * @returns {Promise<Object>} Updated user data
   * @throws {Error} If update fails (with validation errors if available)
   */
  async updateUser(userId, userData) {
    try {
      // PATCH request with update payload
      const data = await securedFetch(
        `${API_BASE_URL}/admin/${userId}/update_user/`,
        {
          method: "PATCH",
          body: JSON.stringify(userData),
        }
      );
      return data;
    } catch (error) {
      // Enhanced error handling for validation errors
      const errorObj = new Error(error.message || "Failed to update user");
      
      if (error.errors) {
        errorObj.errors = error.errors;  // Attach validation details
      }
      
      pretty_log(`Update error (${userId}): ${error.message}`, "ERROR");
      throw errorObj;
    }
  },

  async getPendingApprovals() {
    try {
      return await securedFetch(`${API_BASE_URL}/form-approvals/?status=pending`, {
        method: "GET",
      });
    } catch (error) {
      pretty_log(`Error fetching pending approvals: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to fetch pending approvals");
    }
  },

  /**
   * Approve a submission via its approval endpoint.
   * @param {number|string} approvalId - The ID of the approval record.
   * @returns {Promise<Object>} The updated submission status.
   */
  async approveApproval(approvalId) {
    try {
      return await securedFetch(`${API_BASE_URL}/form-approvals/${approvalId}/approve/`, {
        method: "POST",
      });
    } catch (error) {
      pretty_log(`Error approving submission ${approvalId}: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to approve submission");
    }
  },

  /**
   * Return a submission for changes.
   * @param {number|string} approvalId - The ID of the approval record.
   * @param {string} comment - A comment explaining what needs to be fixed.
   * @returns {Promise<Object>} The updated submission status.
   */
  async returnForChanges(approvalId, comment) {
    try {
      return await securedFetch(`${API_BASE_URL}/form-approvals/${approvalId}/return_for_changes/`, {
        method: "POST",
        body: JSON.stringify({ comments: comment }),
      });
    } catch (error) {
      pretty_log(`Error returning submission ${approvalId}: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to return submission");
    }
  }
};