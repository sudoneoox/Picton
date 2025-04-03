/**
 * Secure Fetch Wrapper
 * Centralized API request handler with CSRF protection and error handling
 * 
 * Features:
 * - Automatic CSRF token inclusion
 * - Cookie credentials management
 * - Unified error handling
 * - Request logging
 */
import { getCSRFToken } from "./common_util";
import { pretty_log } from "./common_util";

export async function securedFetch(url, options = {}) {
  // Retrieve CSRF token from cookies
  const csrfToken = getCSRFToken();

  // Validate CSRF token presence
  if (!csrfToken) {
    pretty_log("Missing CSRF token - authentication required", "ERROR");
    throw new Error("Authentication error. Please refresh the page.");
  }

  // Configure headers with CSRF protection
  const headers = {
    "X-CSRFToken": csrfToken,
    ...options.headers,
  };

  // Remove Content-Type header if body is FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  } else if (!options.headers?.["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    pretty_log(`API Request: ${options.method || 'GET'} ${url}`, "DEBUG");

    // Execute fetch with security settings
    const response = await fetch(url, {
      ...options,
      credentials: "include",  // Include cookies for session management
      headers,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json();
      throw {
        message: errorData.error || "API request failed",
        status: response.status,
        errors: errorData.errors,
      };
    }

    return response.json();
  } catch (error) {
    // Enhance and log error details
    const errorMessage = error.message || `API Error: ${url}`;
    pretty_log(`${errorMessage} (Status: ${error.status || 'Unknown'})`, "ERROR");

    // If CSRF token is invalid, try to refresh the page
    if (error.status === 403 && error.message?.includes("CSRF")) {
      pretty_log("CSRF token validation failed - refreshing page", "ERROR");
      window.location.reload();
      return;
    }

    // Preserve error details for upstream handling
    throw {
      ...error,
      message: errorMessage,
      url,
      method: options.method || 'GET'
    };
  }
}
