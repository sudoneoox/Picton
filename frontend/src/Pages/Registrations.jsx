import { useState } from "react";
import { ToastProvider, useToast } from "../Components/ui/ToastNotification.jsx";
import { KeyRound, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/shadcn/button.tsx";
import { Input } from "../Components/ui/shadcn/input.tsx";
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
  });

  const { showToast } = useToast();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePasswords = () =>
    formData.password === formData.confirmPassword &&
    formData.password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentStep === 1) {
        if (!validateEmail(formData.email)) {
          showToast("Please enter a valid email address", "error", "ERROR");
          return;
        }
        showToast({ email: formData.email }, "success", "Submitted");
      }
      if (currentStep === 2) {
        if (!validatePasswords()) {
          showToast(
            "Passwords must match and be at least 8 characters",
            "error",
            "ERROR"
          );
          return;
        }
        showToast(
          { message: "Password requirements met", strength: "strong" },
          "success",
          "SUCCESS"
        );
      }
      if (currentStep < formSteps.length) {
        setCurrentStep((prev) => prev + 1);
        return;
      }
      showToast({ status: "Success", data: formData }, "success", "SUCCESS");
      navigate("/dashboard");
    } catch (error) {
      showToast(
        {
          error: error.message || "An error occurred",
          details: error.details || {},
        },
        "error",
        "ERROR"
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
            <p>PLACEHOLDER</p>
            <span>PLACEHOLDER</span>
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
                {currentStep === 3 && (
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
                  <Button
                    type="submit"
                    variant="homepage"
                    className="registration-formCard__btn"
                  >
                    {currentStep === formSteps.length ? "Complete" : "Next"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>

          <div className="registration-formCard__divider">
            <div className="registration-formCard__divider-line">
              <div className="registration-formCard__divider-border"></div>
            </div>
            <div className="registration-formCard__divider-text">
              <span>Or continue with</span>
            </div>
          </div>

          <Button variant="homepage" className="registration-formCard__outlook">
            <KeyRound className="registration-formCard__icon" />
            Continue with Outlook
          </Button>

          <div className="registration-formCard__footer">
            <p>
              Already have an account?{" "}
              <Button
                variant="homepage"
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
    title: "Secure Your Account",
    subtitle: "Set a strong password to protect your data",
  },
  {
    id: 3,
    title: "Personal Information",
    subtitle: "Tell us a bit about yourself",
  },
];

export default Registrations;
