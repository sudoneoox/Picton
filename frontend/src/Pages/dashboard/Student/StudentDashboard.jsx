import React, { useState } from "react";
import SubmitForms from "./SubmitForms";
import ViewSubmissions from "./ViewSubmissions";
import { SidebarNav } from "@/components/SidebarNavbar";
import dashboardConfig from "@/dashboard_config";

const StudentDashboard = () => {
  const [activeView, setActiveView] = useState("submit-forms");

  const renderView = () => {
    switch (activeView) {
      case "submit-forms":
        return <SubmitForms />;
      case "view-submissions":
        return <ViewSubmissions />;
      default:
        return <div>Select an item from the sidebar.</div>;
    }
  };

  return (
    <div className="flex">
      <SidebarNav
        userData={dashboardConfig.getConfig().user}
        dashboardConfig={dashboardConfig}
        onViewChange={setActiveView}
      />
      <main className="flex-1 p-6">
        {renderView()}
      </main>
    </div>
  );
};

export default StudentDashboard;
