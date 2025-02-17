import { useState } from "react";
import { useToast } from "../Components/ui/ToastNotification.jsx";
import { KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/shadcn/button.tsx";
import { Input } from "../Components/ui/shadcn/input.tsx";
import { api } from "../api.js";
import { motion, AnimatePresence } from "framer-motion";

import "../styles/output.css";

const Registrations = () => {
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

  // popup notification for forms
  const { showToast } = useToast();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePasswords = () => {
    return (
      formData.password === formData.confirmPassword &&
      formData.password.length >= 8
    );
  };

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
      // Validate current step
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
          {
            message: "Password requirements met",
            strength: "strong",
          },
          "success",
          "Password Valid",
        );
      }

      // If not last step, move to next
      if (currentStep < formSteps.length) {
        setCurrentStep((prev) => prev + 1);
        return;
      }

      // NOTE: Final submission sending this to backend api
      const response = await api.registerUser({
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
        },
        "success",
        "SUCCESS",
      );
      // Redirect to login after successful registration
      navigate("/login");
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
  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
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
      {/* LEFT SIDE SUMMARY END */}
      {/* Right Section - Form START */}
      <div className="registration-right">
        <div className="registration-formContainer">
          {/* NOTE: Animation form steps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="registration-formContainer__header">
                <h1 className="registration-formContainer__title">
                  {formSteps[currentStep - 1].title}
                </h1>
                <p className="registration-formContainer__subtitle">
                  {formSteps[currentStep - 1].subtitle}
                </p>
              </div>

              {/* FORM  */}
              <form
                className="registration-formContainer__form"
                onSubmit={handleSubmit}
              >
                {currentStep === 1 && (
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      handleInputChange("email", e.target.value);
                    }}
                    className="registration-formContainer__input"
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
                      className="registration-formContainer__input registration-formContainer__input"
                    />
                    <Input
                      type="tel"
                      placeholder="Enter a phone number"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="registration-formContainer__input registration-formContainer__input"
                    />
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    <Input
                      type="password"
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      value={formData.password}
                      placeholder="Enter your password"
                      className="registration-formContainer__input registration-formContainer__input--animate"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className="registration-formContainer__input registration-formContainer__input--animate"
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
                      className="registration-formContainer__input"
                    />
                    <Input
                      type="text"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className="registration-formContainer__input"
                    />
                  </>
                )}
                {/* Regular Email Sign In  */}
                <div className="flex justify-between mt-4">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      onClick={handlePrevStep}
                      className="registration-formContainer__navigation"
                    >
                      Previous
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="registration-formContainer__navigation"
                  >
                    {currentStep === formSteps.length ? "Complete" : "Next"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>

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
          <Button className="registration-formContainer__outlook">
            <KeyRound className="registration-formContainer__icon" />
            Continue with Outlook
          </Button>
          <div className="space-y-4 text-center text-sm">
            <p className="text-zinc-400">
              Already have an account?
              <Button
                variant="link"
                className="registration-formContainer__sign-in"
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
    subtitle: "Enter your email below to create an acoount",
  },
  {
    id: 2,
    title: "Lets make your account unique!",
    subtitle: "Enter a username and an optional phone number",
  },
  {
    id: 3,
    title: "Secure Your Account",
    subtitle: "Create a strong password to protect your information",
  },
  // TODO: add with other stuff depending on what our database requires
  {
    id: 4,
    title: "Personal Information",
    subtitle: "Tell us a bit about yourself",
  },
];

export default Registrations;
