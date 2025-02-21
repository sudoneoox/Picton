import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Navbar = ({ config = defaultNavConfig }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        {/* BRAND (LOGO ) START */}
        <Link to="/" className="navbar-brand">
          PICTON
        </Link>
        {/* BRAND (LOGO ) END */}

        {/* MOBILE MENU START */}
        <button
          className="navbar-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
        {/* MOBILE MENU END */}

        {/* Menu Items START */}
        <div className={`navbar-menu ${isMobileMenuOpen ? "active" : ""}`}>
          {config.menuItems.map((item) => (
            <Link to={item.navigation} key={item.name} className="navbar-item">
              {item.name}
            </Link>
          ))}
        </div>
        {/* Menu Items END */}
      </div>
    </nav>
  );
};

const defaultNavConfig = {
  menuItems: [
    { name: "Register", navigation: "/registration" },
    { name: "Login", navigation: "/login" },
  ],
};

export default Navbar;
