import { User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/output.css";

const Navbar = ({ config = defaultNavConfig }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="main-navbar bg-white/80 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 transition-all duration-300">
      <div className="navbar-container">
        <div className="navbar-wrapper">
          {/* BRAND (LOGO ) START */}
          <Link to="/" className="navbar-brand">
            Home
          </Link>
          {/* BRAND (LOGO ) END */}

          {/* MOBILE MENU START */}
          <button
            className="navbar-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu />
          </button>
          {/* MOBILE MENU END */}

          {/* Menu Items START */}
          <div className={`navbar-menu ${isMobileMenuOpen ? "active" : ""}`}>
            {config.menuItems.map((item) => (
              <Link
                to={item.navigation}
                key={item.name}
                className="navbar-item hover:text-zinc-900 dark:hover:text-white"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Menu Items END */}
        </div>
      </div>
    </nav>
  );
};

const defaultNavConfig = {
  menuItems: [
    { name: "Register", navigation: "/registration" },
    { name: "Login", navigation: "/login" },
    { name: "Admin Panel", navigation: "/control-center" }, // <-- Added this so admins can acces it
  ],
};

export default Navbar;
