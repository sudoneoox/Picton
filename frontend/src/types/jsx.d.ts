/**
 * Type declarations for JSX/JS modules
 */

declare module '*.jsx' {
  const content: React.ComponentType<any>;
  export default content;
}

declare module '*.js' {
  const content: any;
  export default content;
}

declare module '@/components/ToastNotification' {
  interface ToastOptions {
    message?: string;
    error?: string;
  }

  interface ToastHook {
    showToast: (options: ToastOptions, type: 'success' | 'error', title?: string) => void;
  }

  export function useToast(): ToastHook;
}

declare module '@/components/ThemeProvider' {
  interface ThemeContextType {
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
  }

  export function useTheme(): ThemeContextType;
}

declare module '@/api/api' {
  interface AuthAPI {
    loginUser: (username: string, password: string) => Promise<any>;
    getCurrentUser: () => Promise<any>;
    registerUser: (userData: any) => Promise<any>;
    azureLogin: (token: string) => Promise<any>;
    azureRegister: (token: string) => Promise<any>;
    logout: () => Promise<void>;
    updateEmail: (email: string) => Promise<any>;
    updateUsername: (username: string) => Promise<any>;
    updatePassword: (data: { currentPassword: string; newPassword: string }) => Promise<any>;
  }

  interface AdminAPI {
    getUsers: () => Promise<any>;
    toggleUserStatus: (userId: number) => Promise<any>;
  }

  interface CommonAPI {
    checkIfSignature: () => Promise<any>;
  }

  interface API {
    auth: AuthAPI;
    admin: AdminAPI;
    commonAPI: CommonAPI;
  }

  export const api: API;
}

declare module '@/Pages/dashboard/Privileged/UserDataTable' {
  interface UserDataTableProps {
    userData: Array<{
      id: number;
      username: string;
      email: string;
      is_active: boolean;
      [key: string]: any;
    }>;
    onToggleStatus: (userId: number) => void;
    canToggleUserStatus: boolean;
  }

  const UserDataTable: React.FC<UserDataTableProps>;
  export default UserDataTable;
}

declare module '@/Pages/dashboard/Privileged/UserCreationForm' {
  const UserCreationForm: React.FC;
  export default UserCreationForm;
}

declare module '@/Pages/dashboard/Student/SubmitForms' {
  interface SubmitFormsProps {
    // Add any props if needed
  }
  const SubmitForms: React.FC<SubmitFormsProps>;
  export default SubmitForms;
}

declare module '@/Pages/dashboard/Common/ViewForms' {
  interface ViewFormsProps {
    // Add any props if needed
  }
  const ViewForms: React.FC<ViewFormsProps>;
  export default ViewForms;
}


declare module '@/Pages/dashboard/Common/DashboardContent' {
  import { ComponentType } from 'react';
  const content: ComponentType<any>;
  export default content;
}

declare module '@/api/common_util' {
  export function pretty_log(message: string, level: string): void;
}

declare module '@/Pages/dashboard/Common/dashboard_config' {
  import { DashboardConfig } from './dashboard';
  export const initializeConfig: (userData: any) => DashboardConfig;
  const config: DashboardConfig;
  export default config;
} 
