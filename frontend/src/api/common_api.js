/**
 * Common API Service
 * Handles shared application functionality including:
 * - Signature verification
 * - Signature uploads
 */
import { API_BASE_URL } from "@/api/common_util";
import { securedFetch } from "./http";
import { pretty_log } from "./common_util";

export const commonAPI = {
  /**
   * Check if user has a valid signature
   * @returns {Promise<Object>} Signature status
   */
  async checkIfSignature() {
    try {
      const data = await securedFetch(`${API_BASE_URL}/signature/check/`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      pretty_log("Signature check successful", "DEBUG");
      return data;
    } catch (error) {
      pretty_log(`Signature check failed: ${error.message}`, "ERROR");
      throw error;
    }
  },

  /**
   * Submit a new signature (handles multipart/form-data)
   * @param {FormData} formData - File upload data
   * @returns {Promise<Object>} Upload result
   */
  async submitSignature(formData) {
    try {
      const data = await securedFetch(`${API_BASE_URL}/signature/upload/`, {
        method: "POST",
        body: formData,
        headers: {
          // Remove Content-Type header to let browser set it with boundary
          'Content-Type': null
        }
      });
      pretty_log("Signature upload successful", "DEBUG");
      return data;
    } catch (error) {
      pretty_log(`Signature upload failed: ${error.message}`, "ERROR");
      throw error;
    }
  }
};