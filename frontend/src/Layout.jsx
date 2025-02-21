import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import AdminDashboard from "@/Pages/dashboard/AdminDashboard";

const Layout = () => {
  const location = useLocation();
  const { hash, pathname, search } = location;
  console.log("DEBUG: current pathname -> ", pathname);

  return (
    <div className="app-container">
      {/* IMPORTANT: DONT SHOW NAVBAR OR FOOTER ON DASHBOARDS */}
      {pathname === "/admin/dashboard" || pathname === "/dashboard" ? (
        <>
          <Outlet />
        </>
      ) : (
        <>
          <Navbar />
          <main className={`main-content-container`}>
            <Outlet />
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};

export default Layout;
