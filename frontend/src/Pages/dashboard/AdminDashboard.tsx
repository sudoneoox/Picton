import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarConfig } from "@/Pages/dashboard/Sidebar-Config";
import DashboardContent from "@/Pages/dashboard/DashboardContent";
import { pretty_log } from "@/api/common_util.js"

export default function AdminDashboard({ userData }: { userData: Object }) {
  // TODO: make the default view the chart stat view once we build it 
  const [activeView, setActiveView] = useState("manage-users");

  pretty_log(`Received Data in Dashboard ${JSON.stringify(userData, null, 4)}`, "DEBUG")
  pretty_log(`Current Active View ${activeView}`, "DEBUG")

  return (
    <SidebarProvider>
      {/* NOTE: SIDEBAR NAV HERE */}
      <SidebarConfig onViewChange={setActiveView} userData={userData} />
      {/* NOTE: RIGHT OF SIDEBAR MAIN CONTENT */}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <DashboardContent activeView={activeView} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
