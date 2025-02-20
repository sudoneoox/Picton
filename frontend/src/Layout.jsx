import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import Navbar from "@/components/Navbar";
import { useLocation } from "react-router-dom";
import Footer from "@/components/Footer";
import "@styles/output.css";

const Layout = () => {
  const location = useLocation();
  const { hash, pathname, search } = location;
  console.log("DEBUG: current pathname -> ", pathname);

  return (
    <div className="app-container">
      {/* DONT SHOW NAVBAR ON DASHBOARDS */}
      {pathname === "/admin/dashboard" || pathname === "/dashboard" ? (
        <>
          <SidebarProvider>
            <main>
              <SidebarTrigger />
              <Outlet />
            </main>
          </SidebarProvider>
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
