import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarConfig } from "@/Pages/dashboard/Sidebar-Config";
import DashboardContent from "@/Pages/dashboard/DashboardContent";

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState("view-users");
  return (
    <SidebarProvider>
      {/* NOTE: SIDEBAR HERE */}
      <SidebarConfig onViewChange={setActiveView} />
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
