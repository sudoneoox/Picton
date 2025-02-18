import { Outlet } from "react-router-dom";
import Navbar from "./Components/Navbar.jsx";
import { useLocation } from "react-router-dom";
import Footer from "./Components/Footer.jsx";
import "./styles/output.css";

const Layout = () => {
  const location = useLocation();
  const { hash, pathname, search } = location;
  console.log("DEBUG: current pathname -> ", pathname);

  return (
    <div className="app-container">
      {/* DONT SHOW NAVBAR ON DASHBOARDS */}
      {pathname === "/control-center" || pathname === "/dashboard" ? (
        <></>
      ) : (
        <Navbar />
      )}
      <main className={`main-content-container`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
