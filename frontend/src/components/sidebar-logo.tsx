import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Command } from "lucide-react";
import { useEffect, useState } from "react";
import { pretty_log } from "@/api/common_util";
import { api } from "@/api/api"


export const SidebarLogo = ({ userData }) => {
  const [unitPosition, setUnitPosition] = useState("");

  useEffect(() => {
    // Only fetch unit position for staff members
    if (userData && userData.role === "staff") {
      const fetchUnitPosition = async () => {
        try {
          // Get the user's approver roles for their units
          const response = await api.staff.getMyUnits();

          if (response && response.length > 0) {
            // Get the first unit approver role
            const unitApprover = await api.staff.getUnitApproverRole(response[0].id);
            if (unitApprover && unitApprover.role) {
              setUnitPosition(unitApprover.role);
            }
          }
        } catch (error) {
          pretty_log(`Error fetching unit position: ${error}`, "ERROR");
        }
      };

      fetchUnitPosition();
    }
  }, [userData]);

  // Display text based on role
  const displayRole = () => {
    if (userData.role === "staff" && unitPosition) {
      return unitPosition;
    } else {
      return userData.role.toUpperCase();
    }
  };

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <a href="#">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Picton LLC</span>
                <span className="truncate text-xs">{displayRole()}</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
};
