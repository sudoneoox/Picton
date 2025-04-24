// IMPORTANT: Main dasboard wrapper component

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/Pages/dashboard/Common/SidebarNavbar";
import DashboardContent from "@/Pages/dashboard/Common/DashboardContent";
import { pretty_log } from "@/api/common_util";
import { initializeConfig } from "@/Pages/dashboard/Common/dashboard_config";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { UserData, DashboardSettings, DashboardConfig } from "@/types/dashboard";

/**
 * Main dashboard component that provides the layout structure
 * Handles sidebar, header, and content rendering based on user role
 */
export default function SharedDashboard({ userData }: { userData: UserData }) {
  // initialize config with user data
  const config: DashboardConfig = initializeConfig(userData);

  const dashboardSettings: DashboardSettings = config.getDashboard();
  pretty_log(`Getting Config in Dashboard`, "INFO");
  pretty_log(`Received General Config in Dashboard ${JSON.stringify(config, null, 4)}`, "DEBUG");
  pretty_log(`Received Dashboard Config in Dashboard ${JSON.stringify(dashboardSettings, null, 4)}`, "DEBUG");

  const [activeView, setActiveView] = useState<string>(dashboardSettings.defaultView || "");

  useEffect(() => {
    setActiveView(dashboardSettings.defaultView || "");
  }, [dashboardSettings]);

  pretty_log(`Received Data in Dashboard ${JSON.stringify(userData, null, 4)}`, "DEBUG");
  pretty_log(`Current Active View ${activeView}`, "DEBUG");

  const renderDashboardContent = () => {
    return <DashboardContent activeView={activeView} dashboardConfig={config} />;
  };

  return (
    <SidebarProvider>
      {/* NOTE: SIDEBAR NAV HERE */}
      <SidebarNav
        onViewChange={setActiveView}
        userData={userData}
        dashboardConfig={config} />

      {/* NOTE: RIGHT OF SIDEBAR MAIN CONTENT */}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-xl font-semibold">
              {activeView === 'submissions' ? 'Submission History' : dashboardSettings.title}
            </h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {renderDashboardContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
