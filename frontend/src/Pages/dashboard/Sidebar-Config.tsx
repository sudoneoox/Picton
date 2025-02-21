// IMPORTANT: Test data make it so that fetching from the database populates this data object
//
import * as React from "react";
import { Users } from "lucide-react";
import { NavMain } from "@/components/sidebar-nav-main";
import { NavUser } from "@/components/sidebar-nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { SidebarLogo } from "@/components/sidebar-logo";

const data = {
  // TODO:
  // NOTE: fetch from api fetch and change these params
  user: {
    name: "Admin (replace)",
    email: "replace@email.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "User Management",
      url: "#",
      icon: Users,
      isActive: true,
      items: [
        {
          title: "View Users",
          url: "#",
        },
        {
          title: "Delete Users",
          url: "#",
        },
        {
          title: "Create Users",
          url: "#",
        },
        {
          title: "Update Users",
          url: "#",
        },
      ],
    },
  ],
};

export function SidebarConfig({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      {/* NOTE: SIDEBAR LOGO */}
      <SidebarLogo />

      {/* NOTE:: SIDEBAR NAV ITEMS */}
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>

      {/* NOTE: SIDEBAR BOTTOM FOOTER SETTINGS */}
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
