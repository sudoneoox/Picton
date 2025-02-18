import { BrowserRouter } from "react-router-dom";
import { StrictMode } from "react";
import { MsalProvider } from "@azure/msal-react";
import { EventType } from "@azure/msal-browser";
import msalInstance from "./msalConfig.js";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/output.css";

// Only handle redirects on the callback page
const shouldHandleRedirect = window.location.pathname.includes(
  "/auth/microsoft/callback",
);

// Add event listener to prevent automatic redirects
msalInstance.addEventCallback((event) => {
  if (
    event.eventType === EventType.LOGOUT_START ||
    event.eventType === EventType.LOGOUT_SUCCESS
  ) {
    if (!window.location.pathname.includes("/logout")) {
      // If not on logout page, prevent automatic redirects
      event.preventDefault();
    }
  }
});

// Initialize MSAL without auto-redirect handling
msalInstance
  .initialize()
  .then(() => {
    // Only handle redirects on specific pages
    if (shouldHandleRedirect) {
      return msalInstance.handleRedirectPromise().catch((error) => {
        console.warn("Redirect handling error:", error);
        // Don't throw, just log
      });
    }
  })
  .finally(() => {
    // Always render the app, regardless of redirect handling
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        <MsalProvider instance={msalInstance}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MsalProvider>
      </StrictMode>,
    );
  });
