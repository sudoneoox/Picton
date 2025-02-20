import { PublicClientApplication, LogLevel } from "@azure/msal-browser";
import { MICROSOFT_FRONTEND_REDIRECT_URL } from "@/api";

const msalConfig = {
  auth: {
    clientId: `${import.meta.env.VITE_AZURE_CLIENT_ID}`,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin + MICROSOFT_FRONTEND_REDIRECT_URL,
    navigateToLoginRequestUrl: false,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowRedirectInFrame: false,
    loggerOptions: {
      logLevel: LogLevel.Error,
    },
  },
};

// Initialize MSAL with proper error handling
const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ["User.Read", "email", "profile"],
};

export default msalInstance;
