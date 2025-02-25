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
import { pretty_log } from "@/api/common_util.js"

export function SidebarConfig({
  onViewChange,
  userData = null,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onViewChange: (view: string) => void;
  userData?: any
}) {

  // if userData is passed, use it , otherwise fetch it 
  const [userDataState, setUserDataState] = useState(
    userData ? {
      name: userData.username || "Admin",
      email: userData.email || "email error",
      avatar: userData.avatar || "/avatars/shadcn.jpg",
    } : {
      name: "Admin",
      email: "admin@picton.com",
      avatar: "/avatars/shadcn.jpg",
    }
  );
  const [activeItem, setActiveItem] = useState("view-users");

  // Only fetch user data if not provided
  useEffect(() => {
    if (!userData) {
      const fetchUserData = async () => {
        try {
          const user = await api.getCurrentUser();
          setUserDataState({
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
    }
  }, [userData]);

  // Handle sidebar item click
  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    onViewChange(itemId);
  };

  const navData = {
    user: userDataState,
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
