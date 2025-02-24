import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import { pretty_log } from "@/api/common_util";

const Layout = () => {
  const location = useLocation();
  const { pathname } = location

  // IMPORTANT: Dont Show Navbar or Footers on these Pages and dont apply main-content-container styles
  const hideLayout = ["/admin/dashboard", "/dashboard", "/unauthorized"].some((route) => pathname.includes(route)) || pathname == "/404"
  pretty_log(`current pathname -> ${pathname}`, "DEBUG");

  return (
    <div className="app-container">
      {/* IMPORTANT: DONT SHOW NAVBAR OR FOOTER ON THESE PAGES*/}
      {hideLayout ? (
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
