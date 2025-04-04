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

  /**
   * Retrieve all form templates
   * @returns {Promise<Array>} List of form template objects
   * @throws {Error} If fetch fails
   */
  async getFormTemplates() {
    try {
      return await securedFetch(`${API_BASE_URL}/forms/templates/`, {
        method: "GET",
      });
    } catch (error) {
      pretty_log(`Form template fetch error: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to fetch form templates");
    }
  },

  /**
   * Create a new form template
   * @param {Object} templateData - Template details
   * @returns {Promise<Object>} Created template data
   * @throws {Error} If creation fails
   */
  async createFormTemplate(templateData) {
    try {
      return await securedFetch(`${API_BASE_URL}/forms/templates/`, {
        method: "POST",
        body: JSON.stringify(templateData),
      });
    } catch (error) {
      pretty_log(`Form template creation error: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to create form template");
    }
  },

  /**
   * Update an existing form template
   * @param {string} templateId - ID of template to update
   * @param {Object} templateData - New template data
   * @returns {Promise<Object>} Updated template data
   * @throws {Error} If update fails
   */
  async updateFormTemplate(templateId, templateData) {
    try {
      return await securedFetch(`${API_BASE_URL}/forms/templates/${templateId}/`, {
        method: "PUT",
        body: JSON.stringify(templateData),
      });
    } catch (error) {
      pretty_log(`Form template update error: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to update form template");
    }
  },

  /**
   * Delete a form template
   * @param {string} templateId - ID of template to delete
   * @returns {Promise<void>}
   * @throws {Error} If deletion fails
   */
  async deleteFormTemplate(templateId) {
    try {
      // Use fetch directly for DELETE requests to handle 204 responses
      const response = await fetch(`${API_BASE_URL}/forms/templates/${templateId}/`, {
        method: "DELETE",
        credentials: 'include', // Include cookies for authentication
        headers: {
          'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete template: ${response.status}`);
      }

      // For 204 No Content, return true without trying to parse JSON
      if (response.status === 204) {
        return true;
      }

      // For other successful responses, try to parse JSON
      const data = await response.json();
      return data;
    } catch (error) {
      pretty_log(`Delete template error: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to delete form template");
    }
  },

  /**
   * Convert PDF to LaTeX template
   * @param {FormData} formData - FormData containing the PDF file
   * @returns {Promise<Object>} Converted LaTeX template
   * @throws {Error} If conversion fails
   */
  async convertPDFToLaTeX(formData) {
    try {
      return await securedFetch(`${API_BASE_URL}/forms/templates/convert-pdf/`, {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
      });
    } catch (error) {
      pretty_log(`PDF conversion error: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to convert PDF");
    }
  },

  /**
   * Preview LaTeX template as PDF
   * @param {Object} data - Template data including LaTeX content and field schema
   * @returns {Promise<Blob>} PDF file blob
   * @throws {Error} If preview generation fails
   */
  async previewLaTeXTemplate(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/templates/preview/`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate preview");
      }

      return await response.blob();
    } catch (error) {
      pretty_log(`Preview generation error: ${error.message}`, "ERROR");
      throw new Error(error.message || "Failed to generate preview");
    }
  },
};