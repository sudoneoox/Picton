// IMPORTANT: Test data make it so that fetching from the database populates this data object
//
import * as React from "react";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { NavMain } from "@/components/sidebar-nav-main";
import { NavUser } from "@/components/sidebar-nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SidebarLogo } from "@/components/sidebar-logo";
import { api } from "@/api/api.js";

export function SidebarConfig({
  onViewChange,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onViewChange: (view: string) => void;
}) {
  const [userData, setUserData] = useState({
    // TODO:
    // // IMPORTANT: change when fetched from api pass to tihs function
    name: "Admin",
    email: "admin@picton.com",
    avatar: "/avatars/shadcn.jpg",
  });
  const [activeItem, setActiveItem] = useState("view-users");

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await api.getCurrentUser();
        setUserData({
          name: user.username || "Admin",
          email: user.email || "admin@picton.com",
          avatar: user.avatar || "/avatars/shadcn.jpg",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Keep default user data
      }
    };

    fetchUserData();
  }, []);

  // Handle sidebar item click
  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    onViewChange(itemId);
  };

  const navData = {
    user: userData,
    navMain: [
      {
        title: "User Management",
        url: "#",
        icon: Users,
        isActive: true,
        // IMPORTANT: items send out api requests
        items: [
          {
            id: "manage-users",
            title: "Manage Users",
            url: "#",
            isActive: activeItem === "manage-users",
            onClick: () => handleItemClick("manage-users"),
          },
          {
            id: "create-users",
            title: "Create Users",
            url: "#",
            isActive: activeItem === "create-users",
            onClick: () => handleItemClick("create-users"),
          },
        ],
      },
    ],
  };

  return (
    <Sidebar variant="inset" {...props}>
      {/* NOTE: SIDEBAR LOGO */}
      <SidebarLogo />

      {/* NOTE:: SIDEBAR NAV ITEMS */}
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>

      {/* NOTE: SIDEBAR BOTTOM FOOTER SETTINGS */}
      <SidebarFooter>
        <NavUser user={navData.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
