import { pretty_log, API_BASE_URL, MICROSOFT_FRONTEND_REDIRECT_URL, DEBUG } from "@/api/common_util"

// IMPORTANT: admin dashoard utilities

export const admin = {
  // INFO: Toggle a Users status if a user is inactive they can no longer log in
  async toggleUserStatus(userId) {
    const response = await fetch(
      `${API_BASE_URL}/users/${userId}/toggle-status/`,
      {
        method: "PATCH",
        credentials: "include",
      },
    );

    if (!response.ok) {
      const error = await response.json();
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
  // TODO: implement frontend form for this and backend request
  async updateUser(userId, userData) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update user");
    }

    return response.json();
  },

  // INFO: allows an admin to delete an accont
  // BUG: maybe this shouldnt be allowed? a deactivated user is enough 
  async deleteUser(userId) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete user");
    }

    return response.json();
  },
}
