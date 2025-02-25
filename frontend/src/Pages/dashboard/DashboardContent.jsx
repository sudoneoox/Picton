import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserDataTable from "@/Pages/dashboard/UserDataTable";
import { api } from "@/api/api.js";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ToastNotification";
import { pretty_log } from "@/api/common_util"

const DashboardContent = ({ activeView }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Load data based on active view
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let response;

        // IMPORTANT:
        // TODO:  change api endpoint functions right now they have the same UI
        // but that should change
        switch (activeView) {
          case "manage-users":
            response = await api.admin.getUsers(); // gets all users in system
            // check if response has results property (paginationn)

            if (response && response.results) {
              setData(response.results); // extract array from result
            } else if (Array.isArray(response)) {
              setData(response); // use directly if alraedy array
            } else {
              setData([]); // fallback to empty data
              pretty_log(`Unexpected Data Type Received ${response} ${typeof response}`, "ERROR");
            }
            break;
          case "create-users":
            // EMPTY there should be a form here nothing for the admin to view
            setData([]);
            setLoading(false);
            return;
          default:
            // TODO: Default dashboard view, perhaps chart view stats of users?
            setData([]);
            setLoading(false);
            return;
        }
      } catch (error) {
        pretty_log(`Error fetching data for ${activeView}: ${error}`, "ERROR");
        showToast(
          { error: error.message || "Failed to load data" },
          "error",
          "Error",
        );

        // For development: use mock data when API fails
        pretty_log(`API Failed for ${activeView} showing mock data`, "INFO")
        setData(getMockData(activeView));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeView, showToast]);


  // TODO: implement in frontend API and backend
  const handleToggleStatus = async (userId) => {
    try {
      await api.admin.toggleUserStatus(userId);

      // Update local state
      setData((prevData) =>
        prevData.map((user) =>
          user.id === userId ? { ...user, is_active: !user.is_active } : user,
        ),
      );

      showToast({ message: "User status updated successfully" }, "success");
    } catch (error) {
      console.error("Error toggling user status:", error);
      showToast(
        { error: error.message || "Failed to update user status" },
        "error",
        "Error",
      );
    }
  };

  // Render appropriate content based on active view
  const renderContent = () => {
    if (loading) {
      return <LoadingSkeleton />;
    }

    switch (activeView) {
      case "manage-users":
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
              />
            </CardContent>
          </Card>
        );
      case "create-users":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Create User</CardTitle>
            </CardHeader>
            <CardContent>
              {/* TODO: Add user creation form */}
              <p>TODO: User creation form</p>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Overview</CardTitle>
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

// INFO:
// Mock data for development when API is unavailable
// Or Something breaks ;(
const getMockData = (view) => {
  if (view.includes("user")) {
    return [
      { id: 1, username: "admin", email: "admin@example.com", is_active: true },
      {
        id: 2,
        username: "johndoe",
        email: "john@example.com",
        is_active: true,
      },
      {
        id: 3,
        username: "janedoe",
        email: "jane@example.com",
        is_active: false,
      },
      {
        id: 4,
        username: "testuser",
        email: "test@example.com",
        is_active: true,
      },
      {
        id: 5,
        username: "inactive",
        email: "inactive@example.com",
        is_active: false,
      },
      { id: 6, username: "newuser", email: "new@example.com", is_active: true },
      { id: 7, username: "olduser", email: "old@example.com", is_active: true },
    ];
  }
  return [];
};

export default DashboardContent;
