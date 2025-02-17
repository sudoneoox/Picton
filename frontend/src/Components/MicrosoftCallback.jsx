import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../Components/ui/ToastNotification.jsx";
import { API_BASE_URL } from "../api.js";

const MicrosoftCallback = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    // The callback URL will include the auth code from Microsoft
    const handleCallback = async () => {
      try {
        // The backend handles the code exchange
        const response = await fetch(
          `${API_BASE_URL}/microsoft/callback/${window.location.search}`,
          {
            method: "GET",
            credentials: "include",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Authentication failed");
        }

        showToast(
          {
            message: "Microsoft login successful",
            user: data.user.email,
          },
          "success",
          "Welcome",
        );

        // Route based on user role
        if (data.user.is_superuser) {
          navigate("/control-center");
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        showToast(
          {
            error: error.message,
          },
          "error",
          "Login Failed",
        );
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate, showToast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing login...</h2>
        <p className="text-gray-600">
          Please wait while we complete your Microsoft login.
        </p>
      </div>
    </div>
  );
};

export default MicrosoftCallback;
