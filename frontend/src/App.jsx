import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { api, pretty_log } from "@/api.js";
import Layout from "@/Layout.jsx";
import { Shared, Dashboard } from "@/Pages/imports.jsx";
import { MicrosoftCallback } from "@/components/MicrosoftCallback.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Shared.Home />} />
        <Route path="login" element={<Shared.Login />} />
        <Route path="registration" element={<Shared.Registrations />} />
        <Route
          path="/auth/microsoft/callback"
          element={<MicrosoftCallback />}
        />

        {/* Admin Routes */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Dashboard.AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* User Routes */}
        {/* IMPORTANT: we dont know what were building so leave this commented out for now  */}
        {/* <Route */}
        {/*   path="dashboard" */}
        {/*   element={ */}
        {/*     <ProtectedRoute allowedRoles={["user", "admin"]}> */}
        {/*       <DashboardSkeleton> */}
        {/*         <UserDashboard /> */}
        {/*       </DashboardSkeleton> */}
        {/*     </ProtectedRoute> */}
        {/*   } */}
        {/* /> */}

        <Route
          path="unauthorized"
          element={<div>You are not authorized to view this page</div>}
        />
      </Route>
    </Routes>
  );
}

// NOTE: Only allow certain roles to access certain url paths
const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectPath = "/login",
}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api.getCurrentUser();
        pretty_log(
          `Received Response from getCurrentUser from inside checkAuth:  ${JSON.stringify(userData, null, 4)}`,
          "DEBUG",
        );
        setUser(userData);
      } catch (error) {
        pretty_log(
          `Failed to get user data inside checkAuth: ${JSON.stringify(userData, null, 4)}`,
          "ERROR",
        );

        pretty_log(`Auth Check Failed ${error}`, "ERROR");

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // failed auth return to /login
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  // allowed roles if admin or user
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.is_superuser ? "admin" : "user")
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
