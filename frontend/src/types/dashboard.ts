/**
 * Type definitions for dashboard components and configurations
 */

export interface UserData {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  [key: string]: any;
}

export interface DashboardPermissions {
  canEditUsers: boolean;
  canCreateUsers: boolean;
  canToggleUserStatus: boolean;
  [key: string]: boolean;
}

export interface DashboardSettings {
  defaultView: string;
  title: string;
}

export interface SidebarItem {
  id: string;
  title: string;
  permissions: string[];
}

export interface SidebarSection {
  title: string;
  icon: string;
  isActive: boolean;
  items: SidebarItem[];
}

export interface DashboardConfig {
  config: {
    permissions: DashboardPermissions;
    user: UserData;
    sidebar: SidebarSection[];
    dashboard: DashboardSettings;
  };
  getConfig: () => any;
  getSidebar: () => SidebarSection[];
  getDashboard: () => DashboardSettings;
  hasPermission: (permission: string) => boolean;
  update: (config: any) => void;
}

export interface DashboardContentProps {
  activeView: string;
  dashboardConfig: DashboardConfig;
}

export interface UserProfileSettingsProps {
  userData: UserData;
  onUpdate: (updatedData: UserData) => void;
} 