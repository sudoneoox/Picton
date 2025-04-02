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

export interface DashboardConfig {
  config?: {
    permissions: DashboardPermissions;
  };
  userData?: UserData;
  updateUserData?: (data: UserData) => void;
  getDashboard?: () => {
    title: string;
    defaultView?: string;
  };
}

export interface DashboardContentProps {
  activeView: string;
  dashboardConfig: DashboardConfig;
}

export interface UserProfileSettingsProps {
  userData: UserData;
  onUpdate: (updatedData: UserData) => void;
} 