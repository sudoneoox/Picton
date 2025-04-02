// IMPORTANT: Test data make it so that fetching from the database populates this data object
//
import * as React from "react";
import { useEffect, useState } from "react";
import { Users, File, User, LucideIcon } from "lucide-react";
import { NavMain } from "@/components/sidebar-nav-main";
import { NavUser } from "@/components/sidebar-nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SidebarLogo } from "@/components/sidebar-logo";
import { api } from "@/api/api";

interface SidebarItem {
  id: string;
  title: string;
  permissions: string[];
}

interface SidebarSection {
  title: string;
  icon: string;
  isActive: boolean;
  items: SidebarItem[];
}

interface UserDataState {
  name: string;
  email: string;
  avatar: string;
}

interface DashboardConfig {
  getSidebar: () => SidebarSection[];
  getDashboard: () => { defaultView: string; title: string };
}

export function SidebarNav({
  onViewChange,
  userData = null,
  dashboardConfig,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onViewChange: (view: string) => void;
  userData?: any;
  dashboardConfig?: DashboardConfig;
}) {
  const [userDataState, setUserDataState] = useState<UserDataState>({
    name: userData?.username || "",
    email: userData?.email || "",
    avatar: userData?.avatar || "",
  });

  // get default view from config
  const dashboard = dashboardConfig?.getDashboard() || { defaultView: "" }
  const [activeItem, setActiveItem] = useState(dashboard.defaultView || "");

  // Only fetch user data if not provided
  useEffect(() => {
    if (!userData) {
      const fetchUserData = async () => {
        try {
          const user = await api.auth.getCurrentUser();
          setUserDataState({
            name: user.username,
            email: user.email,
            avatar: user.avatar,
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

  // get icon component based on icon name
  const getIconComponent = (iconName: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      "Users": Users,
      "File": File,
      "User": User,
    };

    // default to users icon if not found
    return icons[iconName] || Users;
  };

  const buildNavItems = () => {
    if (!dashboardConfig) {
      // Fallback to default if no config
      return [
        {
          title: "Dashboard",
          url: "#",
          icon: Users,
          isActive: true,
          items: [
            {
              id: "dashboard",
              title: "Overview",
              url: "#",
              isActive: activeItem === "dashboard",
              onClick: () => handleItemClick("dashboard"),
            },
          ],
        },
      ];
    }

    const sidebar = dashboardConfig.getSidebar();

    return sidebar.map((section: SidebarSection) => ({
      title: section.title,
      url: "#",
      icon: getIconComponent(section.icon),
      isActive: section.isActive,
      items: section.items.map((item: SidebarItem) => ({
        id: item.id,
        title: item.title,
        url: "#",
        isActive: activeItem === item.id,
        onClick: () => handleItemClick(item.id),
      })),
    }));
  };

  // Use the config to build navigation
  const navData = {
    user: userDataState,
    navMain: buildNavItems(),
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
        <NavUser user={navData.user} onViewChange={onViewChange} />
      </SidebarFooter>
    </Sidebar>
  );
}
