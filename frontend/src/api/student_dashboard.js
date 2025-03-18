import { pretty_log, API_BASE_URL, MICROSOFT_FRONTEND_REDIRECT_URL, DEBUG } from "@/api/common_util"
export const student = {

  async previewForm(form_template, form_data) {
    try {
      pretty_log(`Sending preview request: ${JSON.stringify({ form_template, form_data })}`, "DEBUG");
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';

      pretty_log(`Using CSRF token: ${csrfToken}`, "DEBUG");
      pretty_log(`Sending preview request with template ID: ${form_template}`, "DEBUG");

      const response = await fetch(`${API_BASE_URL}/forms/submission/preview/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
        },
        body: JSON.stringify({
          form_template,
          form_data
        })
      });
      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || `Failed with status: ${response.status}`;
        pretty_log(`Preview form error: ${errorMessage}`, "ERROR");
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      pretty_log(`Error in previewForm: ${error.message}`, "ERROR");
      throw error;
    }
  },

  async submitForm(data) {
    try {
      const { draft_id } = data;

      if (!draft_id) {
        throw new Error("Missing draft ID");
      }
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';

      pretty_log("Submitting Form", "DEBUG");

      const response = await fetch(`${API_BASE_URL}/forms/submission/${draft_id}/submit/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken

        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit form");
      }

      return response.json();
    } catch (error) {
      pretty_log(`Error in submitForm: ${error.message}`, "ERROR");
      throw error;
    }
  }
}

