import { useState } from "react";
import { KeyRound, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/shadcn/button.tsx";
import { Input } from "../Components/ui/shadcn/input.tsx";
import { useToast } from "../Components/ui/ToastNotification.jsx";
import { api } from "../api";
import { useMsal } from "@azure/msal-react";
import "../styles/output.css";

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
      const loginResponse = await instance.loginPopup({
        scopes: ["User.Read", "email", "profile"],
        prompt: "select_account",
      });

      if (loginResponse.accessToken) {
        const response = await api.azureLogin(loginResponse.accessToken);

        showToast(
          {
            message: "Azure login successful",
            user: response.user.email,
          },
          "success",
          "Welcome",
        );

        if (response.user.is_superuser) {
          navigate("/control-center");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      showToast(
        {
          error: error.message,
        },
        "error",
        "Azure Login Failed",
      );
    }
  };

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
      if (response.user.is_admin) {
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
        <div className="registration-formContainer">
          <div className="registration-formContainer__header">
            <h1 className="registration-formContainer__title">
              Log into your account
            </h1>
            <p className="registration-formContainer__subtitle">
              Enter your username below
            </p>
          </div>
          <form
            className="registration-formContainer__form"
            onSubmit={handleSubmit}
          >
            <Input
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className="registration-formContainer__input"
              required
            />
            <Input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="registration-formContainer__input"
              required
            />

            {/* Regular Username Sign In  */}
            <Button
              type="submit"
              className="registration-formContainer__sso"
              disabled={isLoading}
            >
              <User className="registration-formContainer__icon" />
              {isLoading ? "Logging in..." : "Login With Your Username"}
            </Button>

            {/* DIVIDER  */}
            <div className="registration-formContainer__divider">
              <div className="registration-formContainer__divider-line">
                <div className="registration-formContainer__divider-border"></div>
              </div>
              <div className="registration-formContainer__divider-text">
                <span> Or continue with</span>
              </div>
            </div>

            {/* SSO Login  */}
            <Button
              type="button"
              className="registration-formContainer__outlook"
              onClick={handleAzureLogin}
            >
              <KeyRound className="registration-formContainer__icon" />
              Continue with Microsoft
            </Button>
          </form>
          <div className="space-y-4 text-center text-sm">
            <p className="text-zinc-400">
              Dont have an account?
              <Button
                variant="link"
                className="registration-formContainer__sign-in"
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
