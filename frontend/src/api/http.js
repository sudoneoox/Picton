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
  try {
    // First, ensure we have a CSRF token
    const csrfResponse = await fetch('/api/auth/csrf/', {
      credentials: 'include',
    });
    
    if (!csrfResponse.ok) {
      throw new Error('Failed to get CSRF token');
    }

    // Get the CSRF token from cookies
  const csrfToken = getCSRFToken();
  if (!csrfToken) {
      throw new Error('No CSRF token available');
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

    pretty_log(`API Request: ${options.method || 'GET'} ${url}`, "DEBUG");

    // Execute fetch with security settings
    const response = await fetch(url, {
      ...options,
      credentials: "include",  // Include cookies for session management
      headers,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get("content-type");
      
      try {
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          // If response is not JSON (e.g. HTML error page), get text
          const text = await response.text();
          errorData = {
            error: response.status === 500 
              ? "Internal server error. Please try again later."
              : `Server error: ${response.status}`,
            details: text.substring(0, 100) // Only take first 100 chars of error
          };
        }
      } catch (e) {
        errorData = {
          error: "Failed to parse error response",
          details: e.message
        };
      }
      
      // Only reload for CSRF-related 403 errors
      if (response.status === 403 && errorData.error?.toLowerCase().includes('csrf')) {
        window.location.reload();
        return;
      }

      // Debug log the error response
      pretty_log(`API Error Response:`, "ERROR");
      pretty_log(JSON.stringify(errorData, null, 2), "ERROR");

      throw {
        message: errorData.error || errorData.detail || errorData.message || "API request failed",
        status: response.status,
        errors: errorData.errors || errorData,
        details: errorData
      };
    }

    // For 204 No Content responses
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    // Enhance and log error details
    const errorMessage = error.message || `API Error: ${url}`;
    pretty_log(`${errorMessage} (Status: ${error.status || 'Unknown'})`, "ERROR");

    // Preserve error details for upstream handling
    throw {
      ...error,
      message: errorMessage,
      url,
      method: options.method || 'GET'
    };
  }
}
