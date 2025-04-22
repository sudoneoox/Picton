// staff_dashboard.js
import { pretty_log, API_BASE_URL } from "@/api/common_util";
import { securedFetch } from "./http";

export const staff = {
  /**
   * Get all pending approvals for the current staff user
   * @returns {Promise<Array>} List of approval objects
   */
  async getPendingApprovals() {
    try {
      // Updated URL to match your actual endpoint
      const data = await securedFetch(`${API_BASE_URL}/forms/approvals/pending/`, {
        method: "GET",
      });
      return data;
    } catch (error) {
      pretty_log(`Error fetching pending approvals: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to fetch pending approvals");
    }
  },

  /**
   * Approve a form submission
   * @param {string} approvalId - ID of the approval record
   * @param {Object} approvalData - Approval data including comments
   * @returns {Promise<Object>} Updated approval data
   */
  async approveForm(approvalId, approvalData) {
    try {
      // Updated URL to match your actual endpoint
      const data = await securedFetch(`${API_BASE_URL}/forms/approvals/${approvalId}/approve/`, {
        method: "POST",
        body: JSON.stringify(approvalData),
      });
      return data;
    } catch (error) {
      pretty_log(`Error approving form: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to approve form");
    }
  },

  /**
   * Reject a form submission
   * @param {string} approvalId - ID of the approval record
   * @param {Object} rejectionData - Rejection data including comments
   * @returns {Promise<Object>} Updated approval data
   */
  async rejectForm(approvalId, rejectionData) {
    try {
      // Updated URL to match your actual endpoint
      const data = await securedFetch(`${API_BASE_URL}/forms/approvals/${approvalId}/reject/`, {
        method: "POST",
        body: JSON.stringify(rejectionData),
      });
      return data;
    } catch (error) {
      pretty_log(`Error rejecting form: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to reject form");
    }
  },

  /**
   * Get all active delegations for the current user
   * @returns {Promise<Array>} List of delegation objects
   */
  async getActiveDelegations() {
    try {
      const data = await securedFetch(`${API_BASE_URL}/organization/delegations/active/`, {
        method: "GET",
      });
      return data;
    } catch (error) {
      pretty_log(`Error fetching active delegations: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to fetch active delegations");
    }
  },
  /**
   * Create a new delegation
   * @param {Object} delegationData - Delegation details
   * @returns {Promise<Object>} Created delegation data
   */

  async createDelegation(delegationData) {
    try {
      pretty_log(`Creating delegation with data: ${JSON.stringify(delegationData)}`, "DEBUG");

      const data = await securedFetch(`${API_BASE_URL}/organization/delegations/`, {
        method: "POST",
        body: JSON.stringify(delegationData),
      });

      return data;
    } catch (error) {
      // Extract more detailed error message if available
      let errorMessage = "Failed to create delegation";

      if (error.message) {
        errorMessage = error.message;
      }

      if (error.errors) {
        errorMessage = JSON.stringify(error.errors);
      }

      pretty_log(`Error creating delegation: ${errorMessage}`, "ERROR");
      throw error; // Pass the original error with all its properties
    }
  },
  /**
   * Update a delegation
   * @param {string} delegationId - ID of the delegation to update
   * @param {Object} delegationData - Updated delegation data
   * @returns {Promise<Object>} Updated delegation data
   */
  async updateDelegation(delegationId, delegationData) {
    try {
      const data = await securedFetch(`${API_BASE_URL}/organization/delegations/${delegationId}/`, {
        method: "PATCH",
        body: JSON.stringify(delegationData),
      });
      return data;
    } catch (error) {
      pretty_log(`Error updating delegation: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to update delegation");
    }
  },

  /**
   * Cancel a delegation
   * @param {string} delegationId - ID of the delegation to cancel
   * @returns {Promise<Object>} Updated delegation data
   */
  async cancelDelegation(delegationId) {
    try {
      const data = await securedFetch(`${API_BASE_URL}/organization/delegations/${delegationId}/cancel/`, {
        method: "POST",
      });
      return data;
    } catch (error) {
      pretty_log(`Error canceling delegation: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to cancel delegation");
    }
  },

  /**
   * Get units where the current user is an approver
   * @returns {Promise<Array>} List of unit objects
   */
  async getMyUnits() {
    try {
      const data = await securedFetch(`${API_BASE_URL}/organization/approvers/my_units/`, {
        method: "GET",
      });
      return data;
    } catch (error) {
      pretty_log(`Error fetching my units: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to fetch units");
    }
  },

  /**
   * Get the unit approver role for the current user in a specific unit
   * @param {number} unitId - ID of the organizational unit
   * @returns {Promise<Object>} Unit approver information
   */
  async getUnitApproverRole(unitId) {
    try {
      const data = await securedFetch(`${API_BASE_URL}/organization/approvers/role/?unit=${unitId}`, {
        method: "GET",
      });
      return data;
    } catch (error) {
      pretty_log(`Error fetching unit approver role: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to fetch unit approver role");
    }
  },
}
