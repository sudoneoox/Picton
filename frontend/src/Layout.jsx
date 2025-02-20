import { Outlet } from "react-router-dom";
import Navbar from "./Components/Navbar.jsx";
import Footer from "./Components/Footer.jsx";
import "./styles/output.css";

const Layout = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className={`main-content-container`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
