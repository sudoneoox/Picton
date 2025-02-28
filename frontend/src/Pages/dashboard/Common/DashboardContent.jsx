import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserDataTable from "@/Pages/dashboard/Privileged/UserDataTable";
import UserCreationForm from "@/Pages/dashboard/Privileged/UserCreationForm"
import { api } from "@/api/api.js";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ToastNotification";
import { pretty_log } from "@/api/common_util"
import { act } from "react";

const DashboardContent = ({ activeView, dashboardConfig }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // get permissions from dashboardConfig
  const permissions = dashboardConfig?.config?.permissions || {
    canEditUsers: false,
    canCreateUsers: false,
    canToggleUsers: false,
  }

  // Load data based on active view
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let response;

        // Check permissions before making API calls
        switch (activeView) {
          case "manage-users":
            if (!permissions.canEditUsers) {
              pretty_log("User does not have permission to manage users", "WARN");
              setData([]);
              break;
            }

            response = await api.admin.getUsers();
            if (response && response.results) {
              setData(response.results);
            } else if (Array.isArray(response)) {
              setData(response);
            } else {
              setData([]);
              pretty_log(`Unexpected Data Type Received ${response} ${typeof response}`, "ERROR");
            }
            break;

          case "create-users":
            if (!permissions.canCreateUsers) {
              pretty_log("User does not have permission to create users", "WARN");
              setData([]);
              break;
            }

            setData([]);
            break;

          // TODO: Handle other role-specific views here
          case "submit-forms":
          case "view-forms":
          case "review-forms":
            // TODO::  Fetch appropriate data based on role
            pretty_log(`View: ${activeView} NOT YET IMPLEMENTED`, "WARNING")
            setData([]);
            break;

          default:
            // If no active view, check if we should show a default
            const dashboard = dashboardConfig?.getDashboard();
            if (dashboard?.defaultView && dashboard.defaultView !== activeView) {
              pretty_log(`Active view ${activeView} doesn't match default ${dashboard.defaultView}`, "WARN");
            }

            setData([]);
            break;
        }
      } catch (error) {
        pretty_log(`Error fetching data for ${activeView}: ${error}`, "ERROR");
        showToast(
          { error: error.message || "Failed to load data" },
          "error",
          "Error",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeView, showToast, permissions]);


  // TODO: implement in frontend API and backend
  const handleToggleStatus = async (userId) => {
    try {

      // check permission before allowing status toggle
      if (!permissions.canToggleUserStatus) {
        showToast(
          { error: "You do not have permission to toggle user status" },
          "error",
          "Permission Denied"
        )
        return;
      }


      await api.admin.toggleUserStatus(userId);

      // Update local state
      setData((prevData) =>
        prevData.map((user) =>
          user.id === userId ? { ...user, is_active: !user.is_active } : user,
        ),
      );

      showToast({ message: "User status updated successfully" }, "success");
    } catch (error) {
      pretty_log(`Error toggling user status: ${error}`, "ERROR");
      const errorMessage = error.message || "Failed to update user status"

      // Check for specific error types
      if (errorMessage.includes("superuser")) {
        showToast(
          { error: "Cannot change status of superuser accounts" },
          "error",
          "Permission Denied"
        );
      } else if (errorMessage.includes("own account")) {
        showToast(
          { error: "You cannot deactivate your own account" },
          "error",
          "Permission Denied"
        );
      } else {
        showToast(
          { error: errorMessage },
          "error",
          "Error"
        );
      }
    }
  };

  // Render appropriate content based on active view
  const renderContent = () => {
    if (loading) {
      return <LoadingSkeleton />;
    }

    // Get dashboard title and settings from config
    const dashboard = dashboardConfig?.getDashboard() || { title: "Dashboard" };

    switch (activeView) {
      case "manage-users":
        if (!permissions.canEditUsers) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Permission Denied</CardTitle>
              </CardHeader>
              <CardContent>
                <p>You do not have permission to access this page.</p>
              </CardContent>
            </Card>
          )
        }
        return (
          <Card>
            <CardHeader>
              <CardTitle>
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserDataTable
                userData={data}
                onToggleStatus={handleToggleStatus}
                canToggleUserStatus={permissions.canToggleUserStatus}
              />
            </CardContent>
          </Card>
        );
      case "create-users":
        if (!permissions.canCreateUsers) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Permission Denied</CardTitle>
              </CardHeader>
              <CardContent>
                <p>You do not have permission to access this page.</p>
              </CardContent>
            </Card>
          );
        }
        return (
          <Card>
            <CardHeader>
              <CardTitle>Create User</CardTitle>
            </CardHeader>
            <CardContent>
              <UserCreationForm />
            </CardContent>
          </Card>
        );
      case "submit-forms":
      case "view-forms":
      case "review-forms":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{activeView === "submit-forms" ? "Submit Forms" :
                activeView === "view-forms" ? "View Forms" : "Review Forms"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This is the {activeView} view</p>
              <p> TODO: Build these Views </p>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{dashboard.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Select an option from the sidebar</p>
            </CardContent>
          </Card>
        );
    }
  };

  return <div className="w-full">{renderContent()}</div>;
};

// Loading skeleton
// I.E. its an empty blurry table
const LoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-8 w-[250px]" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

export default DashboardContent;
