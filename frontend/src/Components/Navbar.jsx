import { Link } from "react-router-dom";
import "../styles/output.css";

const Navbar = () => {
  return (
    <main className="main-navbar">
      <nav className="navbar-container">
        <Link to="/" className="text-blue-500">
          Home
        </Link>
        <Link to="/registration" className="text-blue-500">
          Register
        </Link>
        <Link to="/login" className="text-blue-500">
          Login
        </Link>
      </nav>
    </main>
  );
};

export default Navbar;
