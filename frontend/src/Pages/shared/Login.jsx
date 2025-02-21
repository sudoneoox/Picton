import { useState, useEffect } from "react";
import { KeyRound, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ToastNotification";
import { api } from "../../api";
import { useMsal } from "@azure/msal-react";

const Login = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { instance } = useMsal();

  const handleAzureLogin = async () => {
    try {
      // Clear MSAL state first
      sessionStorage.removeItem("msal.error");
      localStorage.removeItem("msal.error");
      instance.clearCache();

      // Use popup flow instead of redirect to prevent automatic redirects
      console.log("Starting Microsoft authentication for login");
      const loginResponse = await instance.loginPopup({
        scopes: ["User.Read", "email", "profile"],
        prompt: "select_account",
      });

      console.log("Microsoft authentication successful, proceeding with login");
      if (loginResponse && loginResponse.accessToken) {
        try {
          console.log("Login response account:", loginResponse.account);
          console.log(
            `Attempting login with email: ${loginResponse.account?.username}`,
          );
          const response = await api.azureLogin(loginResponse.accessToken);
          console.log("Login successful:", response);

          showToast(
            {
              message: "Login successful",
              user: response.user.email,
            },
            "success",
            "Welcome",
          );

          if (response.user.is_superuser) {
            navigate("/admin/dashboard");
          } else {
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Backend login error:", error);
          if (error.message.includes("not found")) {
            showToast(
              { message: "Account not found. Please register first." },
              "error",
              "Login Failed",
            );
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      instance.clearCache();

      showToast(
        { error: error.message || "Login failed" },
        "error",
        "Login Failed",
      );
    }
  };

  // FIX: when microsoft OAuth crashes the storage session isnt cleared and makes the website for that user completely unusable
  useEffect(() => {
    // Clear Microsoft auth state on component mount
    const clearMicrosoftState = () => {
      if (instance) {
        // Remove error states
        sessionStorage.removeItem("msal.error");
        localStorage.removeItem("msal.error");

        // Clear all tokens and cache
        instance.clearCache();

        // Optional: ensure logout is complete
        instance.logoutRedirect().catch(() => {
          // Silent fail - just log it
          console.log("Microsoft logout silent fail - continuing");
        });
      }
    };

    clearMicrosoftState();

    // No cleanup needed here as we're handling it in the unmount effect
  }, [instance]);
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.loginUser(
        formData.username,
        formData.password,
      );

      showToast(
        {
          message: "Login successful",
          user: response.user.username,
        },
        "success",
        "Welcome",
      );

      // Route based on user role
      if (response.user.is_superuser) {
        navigate("/admin/dashboard");
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-container">
      {/* LEFT SIDE SUMMARY START  */}
      <div className="registration-left">
        <div className="registration-left__logo">
          <h1>Picton LLC</h1>
        </div>
        <div className="registration-left__testimonial">
          <p>PLACEHOLDER</p>
          <span>PLACEHOLDER</span>
        </div>
      </div>

      {/* Right Section - Form START */}
      <div className="registration-right">
        <div className="registration-formCard">
          <div className="registration-formCard__header">
            <h1 className="registration-formCard__title">
              Log into your account
            </h1>
            <p className="registration-formCard__subtitle">
              Enter your username below
            </p>
          </div>
          <form className="registration-formCard__form" onSubmit={handleSubmit}>
            <Input
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className="registration-formCard__input"
              required
            />
            <Input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="registration-formCard__input"
              required
            />

            {/* Regular Username Sign In  */}
            <Button
              type="submit"
              className="registration-formCard__sso"
              disabled={isLoading}
            >
              <User className="registration-formCard__icon" />
              {isLoading ? "Logging in..." : "Login With Your Username"}
            </Button>

            {/* DIVIDER  */}
            <div className="registration-formCard__divider">
              <div className="registration-formCard__divider-line">
                <div className="registration-formCard__divider-border"></div>
              </div>
              <div className="registration-formCard__divider-text">
                <span> Or continue with</span>
              </div>
            </div>

            {/* SSO Login  */}
            <Button
              type="button"
              className="registration-formCard__outlook"
              onClick={handleAzureLogin}
            >
              <KeyRound className="registration-formCard__icon" />
              Continue with Microsoft
            </Button>
          </form>

          <div className="space-y-4 text-center text-sm">
            <p className="text-zinc-400">
              Dont have an account?
              <Button
                variant="link"
                className="registration-formCard__sign-in"
                onClick={() => navigate("/registration")}
              >
                Register
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
