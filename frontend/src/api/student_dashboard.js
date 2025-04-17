import { pretty_log, API_BASE_URL, getCSRFToken } from "@/api/common_util"


export const student = {

  async getFormTemplates() {
    try {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';

      const response = await fetch(`${API_BASE_URL}/forms/templates/`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch form templates");
      }

      return response.json();
    } catch (error) {
      pretty_log(`Error in getFormTemplates: ${error.message}`, "ERROR");
      throw error;
    }
  },

  async getFormSubmissions() {
    try {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1] || '';

      const response = await fetch(`${API_BASE_URL}/forms/submission/`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch form submissions");
      }

      return response.json();
    } catch (error) {
      pretty_log(`Error in getFormSubmissions: ${error.message}`, "ERROR");
      throw error;
    }
  },

  async previewForm(requestData) {
    try {
      const response = await fetch(`${API_BASE_URL}/forms/submission/preview/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error || `Failed with status: ${response.status}`;
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

      const response = await fetch(`${API_BASE_URL}/forms/submission/${draft_id}/submit/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),

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
  },

  // used in student view-forms sideber navigation to get the corresponding pdf once a 
  // student clicks on the specific form
  async getSubmissionByidentifier(identifier) {
    try {
      const csrfToken = getCSRFToken()
      const response = await fetch(`${API_BASE_URL}/forms/submission/by_identifier/?identifier=${identifier}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch submission details");
      }
      return response.json()

    } catch (error) {
      pretty_log(`Error in getSubmissionByidentifier: ${error.message}`, "ERROR")
      throw error
    }
  },


  // GETS all forms in view-forms sidebar navigation in order to populate it
  async getAllFormIdentifiers() {
    try {
      const csrfToken = getCSRFToken()
      const response = await fetch(`${API_BASE_URL}/forms/submission/all_identifiers/`, {
        method: "GET",
        credentials: "include",
        headers: {
          'Content-Type': "application/json",
          "X-CSRFToken": csrfToken
        }
      })
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch form identifiers")

      }
      return response.json()
    } catch (error) {
      pretty_log(`Error in getAllFormIdentifiers: ${error.message}`, "ERROR")
    }
  }


}


