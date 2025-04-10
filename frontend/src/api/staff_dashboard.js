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
  }
};
