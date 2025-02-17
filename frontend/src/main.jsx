import { BrowserRouter } from "react-router-dom";
import { StrictMode } from "react";
import { MsalProvider } from "@azure/msal-react";
import msalInstance from "./msalConfig.js";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/output.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MsalProvider>
  </StrictMode>,
);
