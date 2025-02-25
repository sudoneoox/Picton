export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const MICROSOFT_FRONTEND_REDIRECT_URL =
  import.meta.env.MICROSOFT_REDIRECT_URL || "/auth/microsoft/callback";

// turn on debug if in development environment
export const DEBUG = import.meta.env.DEV === true


// This function allows to to make colored outputs in web developer tools consoles
// Different colors for different message types to better distinguish them
export const pretty_log = (msg, msg_type) => {

  // NOTE: only output "DEBUG" messages if DEBUG is set to true in .env
  if (msg_type.toUpperCase() == "DEBUG" && !DEBUG) return;

  let style = "";

  switch (msg_type.toUpperCase()) {
    case "WARNING":
      style =
        "background: #ffcc00; color: #000; font-weight: bold; padding: 2px 5px;";
      break;
    case "ERROR":
      style =
        "background: #ff0000; color: #fff; font-weight: bold; padding: 2px 5px;";
      break;
    case "INFO":
      style =
        "background: #008000; color: #fff; font-weight: bold; padding: 2px 5px;";
      break;
    case "DEBUG":
      style =
        "background: #0000ff; color: #fff; font-weight: bold; padding: 2px 5px;";
      break;
    default:
      style =
        "background: #008000; color: #fff; font-weight: bold; padding: 2px 5px;";
      break;
  }

  console.log(`%c[${msg_type.toUpperCase()}] ${msg}`, style);
};


// TEST: environment variables in dev environment 
(function() {
  if (import.meta.env.DEV) {
    pretty_log("Testing Environment Variables this should not be empty", "WARNING")
    pretty_log(`MICROSOFT_FRONTEND_REDIRECT_URL: ${MICROSOFT_FRONTEND_REDIRECT_URL}`, "DEBUG")
    pretty_log(`API_BASE_URL: ${API_BASE_URL}`, "DEBUG")
    pretty_log(`DEBUG: ${DEBUG}`, "DEBUG")
  }
}())



