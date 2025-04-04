import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserDataTable from "@/Pages/dashboard/Privileged/UserDataTable";
import UserCreationForm from "@/Pages/dashboard/Privileged/UserCreationForm"
import FormSchemaManager from "@/Pages/dashboard/Privileged/FormSchemaManager";
import { api } from "@/api/api.js";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ToastNotification";
import { pretty_log } from "@/api/common_util"
import { act } from "react";
import SubmitForms from "../Student/SubmitForms";
import ViewForms from "./ViewForms";
import { UserProfileSettings } from "@/components/UserProfileSettings";
import { Switch } from "@/components/ui/switch";

const DashboardContent = ({ activeView, dashboardConfig }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  pretty_log(`ACTIVE VIEW ${activeView}`, "INFO")

  // get permissions from dashboardConfig
  const permissions = dashboardConfig?.config?.permissions || {
    canEditUsers: false,
    canCreateUsers: false,
    canToggleUsers: false,
    canManageFormSchemas: false,
  }

  // Load data based on active view
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let response;

        // Check permissions before making API calls
        switch (activeView) {
          case "profile":
            // No data fetching needed for profile view
            setData([]);
            break;

          case "manage-users":

            if (!permissions.canEditUsers) {
              pretty_log("User does not have permission to manage users", "WARNING");
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
              pretty_log("User does not have permission to create users", "WARNING");
              setData([]);
              break;
            }
            response = await api.admin.getUsers();
            setData(response);
            break;

          case "submit-forms":
            response = await api.student.getFormTemplates();
            setData(response);
            break;

          case "view-forms":
            response = await api.student.getFormSubmissions();
            setData(response);
            break;

          case "notifications":
            setData([]);
            break;

          case "manage-form-schemas":
            if (!permissions.canManageFormSchemas) {
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Permission Denied</CardTitle>
                  </CardHeader>
                  <CardContent>
                    You do not have permission to manage form templates.
                  </CardContent>
                </Card>
              );
            }
            return <FormSchemaManager />;

          default:
            setData([]);
        }
      } catch (error) {
        pretty_log(`Error fetching data: ${error}`, "ERROR");
        showToast({ error: "Failed to fetch data" }, "error");
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
      case "profile":
        // Get user data from the config
        const userData = dashboardConfig?.config?.user;
        if (!userData) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Unable to load user data. Please try refreshing the page.</p>
              </CardContent>
            </Card>
          );
        }
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <UserProfileSettings
                userData={userData}
                onUpdate={(updatedData) => {
                  if (dashboardConfig.updateUserData) {
                    dashboardConfig.updateUserData(updatedData);
                  }
                }}
              />
            </CardContent>
          </Card>
        );

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
          )
        }
        return (
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <UserCreationForm />
            </CardContent>
          </Card>
        );

      case "submit-forms":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Submit Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmitForms formTemplates={data} />
            </CardContent>
          </Card>
        );

      case "view-forms":
        return (
          <Card>
            <CardHeader>
              <CardTitle>View Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <ViewForms submissions={data} />
            </CardContent>
          </Card>
        );

      case "notifications":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Form Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your forms are approved or need changes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">System Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about system maintenance and updates
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case "manage-form-schemas":
        if (!permissions.canManageFormSchemas) {
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
        return <FormSchemaManager />;

      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to {dashboard.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Select an option from the sidebar</p>
            </CardContent>
          </Card>
        );
    }
  };

  return renderContent();
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
