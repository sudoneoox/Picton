import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useToast } from "./ui/ToastNotification";

export const MicrosoftCallback = () => {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const response = await instance.handleRedirectPromise();
        if (response) {
          // Handle successful login
          navigate("/dashboard");
        }
      } catch (error) {
        showToast(
          {
            error: error.message,
          },
          "error",
          "Microsoft Login Failed",
        );
        navigate("/login");
      }
    };

    handleCallback();
  }, [instance, navigate, showToast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Processing Microsoft login...</p>
    </div>
  );
};
