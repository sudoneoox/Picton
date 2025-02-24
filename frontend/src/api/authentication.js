import { pretty_log, API_BASE_URL, MICROSOFT_FRONTEND_REDIRECT_URL, DEBUG } from "@/api/common_util"

export const auth = {

  // NOTE: User Authentication API
  async loginUser(username, password) {
    pretty_log("Entering loginUser API", "INFO");
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: "POST",
      credentials: "include", // for sessions cookies,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    pretty_log("Received Request inside login_user", "DEBUG");

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    return data;
  },

  // NOTE: Authentication middleware to passthrough dashboard
  // makes sure that a non admin cannot access an admin dashboard
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

  // NOTE: User Registration API
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


  // NOTE: Microsoft Authentication API
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

  // NOTE: Microsoft Registration API
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

}
