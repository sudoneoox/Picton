import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastNotification";
import { KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/api/api.js"
import { motion, AnimatePresence } from "framer-motion";
import { useMsal } from "@azure/msal-react";

const Registrations = () => {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    username: "",
  });

  const { showToast } = useToast();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAzureRegistration = async () => {
    try {
      // Clear existing state
      sessionStorage.removeItem("msal.error");
      localStorage.removeItem("msal.error");
      instance.clearCache();

      console.log("Starting Microsoft authentication for registration");
      // Use popup to prevent auto-redirects
      const loginResponse = await instance.loginPopup({
        scopes: ["User.Read", "email", "profile"],
        prompt: "select_account",
      });

      console.log(
        "Microsoft authentication successful, proceeding with registration",
      );

      if (loginResponse && loginResponse.accessToken) {
        try {
          // Register with backend
          const response = await api.auth.azureRegister(loginResponse.accessToken);

          console.log("Registration successful:", response);
          showToast(
            { message: "Registration successful", user: response.user.email },
            "success",
            "Welcome",
          );

          // Manually sign out without redirect
          await instance.clearCache();
          instance
            .logoutPopup({ onRedirectNavigate: () => false })
            .catch(() => {
              /* Ignore redirect errors */
            });

          // Navigate to login page
          navigate("/login");
        } catch (error) {
          console.error("Backend registration error:", error);
          if (error.message.includes("already exists")) {
            showToast(
              { message: "Account already exists. Please login instead." },
              "info",
              "Account Exists",
            );
            navigate("/login");
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      instance.clearCache();

      showToast(
        { error: error.message || "Registration failed" },
        "error",
        "Registration Failed",
      );
    }
  };

  // FIX: when microsoft OAuth crashes the storage session isnt cleared and makes the website for that user completely unusable
  useEffect(() => {
    // cleanup function to run when component unmounts
    return () => {
      // if ongoing authentication instance cancel it
      if (instance) {
        instance.logoutRedirect().catch((e) => {
          console.log("Silent logout error", e);
        });
      }
    };
  }, [instance]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePasswords = () =>
    formData.password === formData.confirmPassword &&
    formData.password.length >= 8;

  const validatePhone = () => {
    return /(^((\+\d{1,2}|1)[\s.-]?)?\(?[2-9](?!11)\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}$|^$)/.test(
      formData.phone,
    );
  };

  const validateUsername = () => {
    return formData.username.length >= 4 && formData.username.length <= 20;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentStep === 1) {
        if (!validateEmail(formData.email)) {
          showToast("Please enter a valid email address", "error", "ERROR");
          return;
        }
        showToast({ email: formData.email }, "success", "Email Validated");
      }
      if (currentStep === 2) {
        if (!validateUsername()) {
          showToast(
            "Username must be between 4-30 characters",
            "error",
            "ERROR",
          );
          return;
        }
        if (!validatePhone()) {
          showToast(
            "Phone number must be a valid 10 digit phone number",
            "error",
            "ERROR",
          );
          return;
        }
        showToast("Awesome! got your username", "success", "Username acquired");
      }
      if (currentStep === 3) {
        if (!validatePasswords()) {
          showToast(
            "Passwords must match and be at least 8 characters",
            "error",
            "ERROR",
          );
          return;
        }
        showToast(
          { message: "Password requirements met", strength: "strong" },
          "success",
          "Password Valid",
        );
      }
      if (currentStep < formSteps.length) {
        setCurrentStep((prev) => prev + 1);
        return;
      }

      // NOTE: Final submission sending this to backend api
      const response = await api.auth.registerUser({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || "",
      });
      showToast(
        {
          status: "Success",
          message: "Registration successful",
          personalId: response.personal_id,
        },
        "success",
        "Your Student ID",
      );

      // add confirmation dialog to show id before redirecting
      const confirmRedirect = window.confirm(
        `Registration successful! Your CougarnetID is ${response.personal_id}. Please save this ID as you'll need it to log in.\n\nClick OK to continue to login.`
      )

      if (confirmRedirect) {
        // Redirect to login after successful registration
        navigate("/login");
      }
    } catch (error) {
      showToast(
        {
          error: error.message || "An error occurred",
          details: error.details || {},
        },
        "error",
        "Registration Failed",
      );
    }
  };

  const handlePrevStep = () => setCurrentStep((prev) => prev - 1);

  return (
    <div className="registration-container">
      {/* Left Panel (Summary) */}
      <div className="registration-left">
        <div className="registration-left__content">
          <h1 className="registration-left__logo">Picton LLC</h1>
          <div className="registration-left__testimonial">
            {/* <p>PLACEHOLDER</p> */}
            {/* <span>PLACEHOLDER</span> */}
          </div>
        </div>
      </div>

      {/* Right Panel (Translucent Card) */}
      <div className="registration-right">
        <div className="registration-formCard">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="registration-formCard__header">
                <h1 className="registration-formCard__title">
                  {formSteps[currentStep - 1].title}
                </h1>
                <p className="registration-formCard__subtitle">
                  {formSteps[currentStep - 1].subtitle}
                </p>
              </div>

              <form
                className="registration-formCard__form"
                onSubmit={handleSubmit}
              >
                {currentStep === 1 && (
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="registration-formCard__input"
                  />
                )}
                {currentStep === 2 && (
                  <>
                    <Input
                      type="text"
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      value={formData.username}
                      placeholder="Enter Your Username"
                      className="registration-formCard__input"
                    />
                    <Input
                      type="tel"
                      placeholder="Enter a phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="registration-formCard__input"
                    />
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className="registration-formCard__input registration-formCard__input--animate"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className="registration-formCard__input registration-formCard__input--animate"
                    />
                  </>
                )}
                {currentStep === 4 && (
                  <>
                    <Input
                      type="text"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className="registration-formCard__input"
                    />
                    <Input
                      type="text"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className="registration-formCard__input"
                    />
                  </>
                )}

                <div className="registration-formCard__nav-row">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="homepage"
                      onClick={handlePrevStep}
                      className="registration-formCard__btn"
                    >
                      Previous
                    </Button>
                  )}
                  <Button variant="" type="submit" className="registration-formCard__btn">
                    {currentStep === formSteps.length ? "Complete" : "Next"}
                  </Button>
                </div>
                <div className="registration-formCard__divider">
                  <div className="registration-formCard__divider-line">
                    <div className="registration-formCard__divider-border"></div>
                  </div>
                  <div className="registration-formCard__divider-text">
                    <span>Or continue with</span>
                  </div>
                </div>

                <Button
                  variant="homepage"
                  className="registration-formCard__outlook"
                  onClick={handleAzureRegistration}
                >
                  <KeyRound className="registration-formCard__icon" />
                  Continue with Microsoft
                </Button>
              </form>
            </motion.div>
          </AnimatePresence>

          <div className="registration-formCard__footer">
            <p>
              Already have an account?{" "}
              <Button
                variant=""
                className="registration-formCard__sign-in"
                onClick={() => navigate("/login")}
              >
                Sign in
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const formSteps = [
  {
    id: 1,
    title: "Create an Account",
    subtitle: "Enter your email to begin",
  },
  {
    id: 2,
    title: "Lets make your account unique!",
    subtitle: "Enter a username and an optional phone number",
  },
  {
    id: 3,
    title: "Secure Your Account",
    subtitle: "Set a strong password to protect your data",
  },
  {
    id: 4,
    title: "Personal Information",
    subtitle: "Tell us a bit about yourself",
  },
];

export default Registrations;
