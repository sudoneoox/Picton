const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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
};
