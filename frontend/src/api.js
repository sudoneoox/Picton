export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const MICROSOFT_FRONTEND_REDIRECT_URL =
  import.meta.env.MICROSOFT_REDIRECT_URL || "/auth/microsoft/callback";

export const api = {
  // NOTE: USER LOGIN FUNCTIONALITY
  async loginUser(username, password) {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: "POST",
      credentials: "include", // for sessions cookies,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    return data;
  },

  // NOTE: Authentication middleware to passthrough dashboard
  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/users/me/`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch user profile");
    }

    return response.json();
  },

  // NOTE: USER REGISTRATION FUNCTIONALITY
  async registerUser(userData) {
    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    return response.json();
  },

  // NOTE: TOGGLE USER STATUS FUNCTIONALITY
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

  // NOTE: Microsoft login api request
  async azureLogin(token) {
    const response = await fetch(`${API_BASE_URL}/azure/login/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Azure login failed");
    }

    return response.json();
  },

  async azureRegister(token) {
    try {
      console.log("Sending token to backend:", token.substring(0, 20) + "...");

      const response = await fetch(`${API_BASE_URL}/azure/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      // Log response status
      console.log("Backend registration response status:", response.status);

      const responseText = await response.text();
      console.log("Raw response body:", responseText);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || "Azure registration failed");
        } catch (parseError) {
          throw new Error(`Server error: ${responseText}`);
        }
      }

      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText);
        return data;
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(`Failed to parse response: ${responseText}`);
      }
    } catch (error) {
      console.error("Azure registration error:", error);
      throw error;
    }
  },

  // IMPORTANT:
  // NOTE: admin dashoard utilities
  // INFO: TOGGLE USER STATUS FUNCTIONALITY
  // TODO: implement in backend
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

  // INFO: Get all users
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

  // INFO: Create user (admin version)
  // TODO: backend inmplementaion
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

  //INFO: Update user
  //TODO: backend implementation
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

  // INFO: Delete user
  // TODO: backend implementation
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
};
