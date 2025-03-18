import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useToast } from "@/components/ToastNotification";

export const MicrosoftCallback = () => {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [processingAuth, setProcessingAuth] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Clear MSAL interaction state
        sessionStorage.removeItem("msal.interaction.status");

        // Only try to handle redirect on this specific page
        const response = await instance.handleRedirectPromise();

        if (response) {
          // Successfully handled auth response
          showToast(
            { message: "Microsoft authentication successful" },
            "success",
          );
          navigate("/dashboard");
        } else {
          // Check if user is already logged in
          if (instance.getAllAccounts().length > 0) {
            navigate("/dashboard");
          } else {
            navigate("/login");
          }
        }
      } catch (error) {
        // Add specific error handling
        if (error.errorMessage.includes("AADSTS900023")) {
          showToast(
            { error: "Invalid tenant configuration. Contact support." },
            "error",
            "Azure Configuration Error"
          );
        }

        console.error("MSAL redirect handling error:", error);

        // Clear problematic state
        sessionStorage.removeItem("msal.error");
        localStorage.removeItem("msal.error");
        instance.clearCache();

        showToast(
          { error: error.message || "Authentication failed" },
          "error",
          "Microsoft Login Failed",
        );
        navigate("/login");
      } finally {
        setProcessingAuth(false);
      }
    };

    handleCallback();
  }, [instance, navigate, showToast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {processingAuth ? (
        <p>Processing Microsoft authentication...</p>
      ) : (
        <p>Redirecting...</p>
      )}
    </div>
  );
};
