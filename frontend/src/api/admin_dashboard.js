import { pretty_log, API_BASE_URL, MICROSOFT_FRONTEND_REDIRECT_URL, DEBUG } from "@/api/common_util"

// IMPORTANT: admin dashoard utilities

export const admin = {
  // INFO: Toggle a Users status if a user is inactive they can no longer log in
  async toggleUserStatus(userId) {
    // IMPORTANT: django needs a csrfToken for privileged commands when doing POST,PUT,PATCH, and DELETE
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    pretty_log(`Got CSRFToken from toggleUserStatus: ${csrfToken}`, "DEBUG")

    const response = await fetch(
      `${API_BASE_URL}/admin/${userId}/toggle_status/`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
        }
      },
    );

    if (!response.ok) {
      const error = await response.json();
      pretty_log(` Received when trying to toggle user status (id, error) ${userId} ${error}`, "ERROR")
      throw new Error(error.error || "Failed to toggle user status");
    }

    return response.json();
  },

  // INFO: Gets all system users to display in the user management tab
  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/admin/users/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch users");
    }

    return response.json();
  },

  // INFO: Create a new system user (admin version)
  // TODO: Implement the frontend form and backend request for this
  async createUser(userData) {
    const response = await fetch(`${API_BASE_URL}/admin/users/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create user");
    }

    return response.json();
  },


  // INFO: update a users acouunt information such as email, password, etc.
  async updateUser(userId, userData) {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    pretty_log(`Got CSRFToken from toggleUserStatus: ${csrfToken}`, "DEBUG")


    const response = await fetch(
      `${API_BASE_URL}/admin/${userId}/update_user/`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken
        },
        body: JSON.stringify(userData),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || "Failed to update user");

      // Add the error fields if they exist component expects this format
      if (typeof data === 'object' && Object.keys(data).length > 0) {
        error.errors = data;
      }

      throw error;
    }

    return data;
  }
}
