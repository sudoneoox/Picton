import { useState } from "react";
import { KeyRound, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../Components/ui/shadcn/button.tsx";
import { Input } from "../Components/ui/shadcn/input.tsx";
import "../styles/output.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

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
          <div className="registration-formContainer__header">
            <h1 className="registration-formContainer__title">
              Log into your account
            </h1>
            <p className="registration-formContainer__subtitle">
              Enter your email below
            </p>
          </div>
          <form className="registration-formContainer__form">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="registration-formContainer__input"
            />

            {/* TODO: show password if email is valid NOT RIGHT AWAY*/}
            <Input
              type="password"
              placeholder="Enter your password"
              className="registration-formContainer__input registration-formContainer__input"
            />

            {/* Regular Email Sign In  */}
            <Button className="registration-formContainer__sso">
              <Mail className="registration-formContainer__icon" />
              Login With Your Email
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
            <Button className="registration-formContainer__outlook">
              <KeyRound className="registration-formContainer__icon" />
              Continue with Outlook
            </Button>
          </form>
          <div className="space-y-4 text-center text-sm">
            <p className="text-zinc-400">
              Dont have an acoount?
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
