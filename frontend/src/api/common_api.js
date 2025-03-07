import { pretty_log, API_BASE_URL, MICROSOFT_FRONTEND_REDIRECT_URL, DEBUG } from "@/api/common_util"

export const commonAPI = {
  async checkIfSignature() {
    try {
      // Get CSRF token
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';

      pretty_log(`Using CSRF token: ${csrfToken}`, "DEBUG");

      const response = await fetch(`${API_BASE_URL}/signature/check/`, {
        method: "POST",
        credentials: "include",
        headers: {
          'Content-Type': "application/json",
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        pretty_log(`Signature check failed: ${JSON.stringify(errorData)}`, "ERROR");
        throw new Error(errorData.error || "Failed to check signature status");
      }

      const data = await response.json();
      pretty_log(`Signature check response: ${JSON.stringify(data)}`, "DEBUG");
      return data;
    } catch (error) {
      pretty_log(`Error in checkIfSignature: ${error.message}`, "ERROR");
      throw error;
    }
  },

  async submitSignature(formData) {
    try {
      // Get CSRF token
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';

      pretty_log(`Using CSRF token for upload: ${csrfToken}`, "DEBUG");

      const response = await fetch(`${API_BASE_URL}/signature/upload/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        pretty_log(`Signature upload failed: ${JSON.stringify(errorData)}`, "ERROR");
        throw new Error(errorData.error || "Failed to upload signature");
      }

      const data = await response.json();
      pretty_log(`Signature upload response: ${JSON.stringify(data)}`, "DEBUG");
      return data;
    } catch (error) {
      pretty_log(`Error in submitSignature: ${error.message}`, "ERROR");
      throw error;
    }
  }
}
