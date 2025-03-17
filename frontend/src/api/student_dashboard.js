import { pretty_log, API_BASE_URL, MICROSOFT_FRONTEND_REDIRECT_URL, DEBUG } from "@/api/common_util"
export const student = {
  async previewForm(form_template, form_data) {
    const response = await fetch(`${API_BASE_URL}/forms/submission/preview/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        form_template,
        ...form_data
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch users");
    }

    return response.json();
  }
}

