// IMPORTANT: Configuration system for role-based dashboard setup


import { pretty_log } from "@/api/common_util.js"


/**
 * Configuration settings for different user roles 
 * Each role has:
 * - sidebar: Navigation sections and items
 * - dashboard: Default view and title settings
 * - permissions: Role-specific capabilities
 */
const roleConfigs = {
  admin: {
    sidebar: [
      {
        title: "User Management",
        icon: "Users",
        isActive: true,
        items: [
          {
            id: "manage-users",
            title: "Manage Users",
            permissions: ["admin.manage_users"]
          }
        ]
      },
      {
        title: "Form Management",
        icon: "FileText",
        isActive: true,
        items: [
          {
            id: "manage-form-schemas",
            title: "Manage Form Templates",
            permissions: ["admin.manage_form_schemas"]
          }
        ]
      },
      {
        title: "Organization",
        icon: "Building",
        isActive: true,
        items: [
          {
            id: "manage-organization",
            title: "Organization Structure",
            permissions: ["admin.manage_organization"]
          }
        ]
      },
    ],
    dashboard: {
      defaultView: "",
      title: "Admin Dashboard"
    },
    permissions: {
      canEditUsers: true,
      canCreateUsers: true,
      canToggleUserStatus: true,
      canManageFormSchemas: true,
      canManageOrganization: true
    }
  },

  staff: {
    sidebar: [
      {
        title: "Form Management",
        icon: "File",
        isActive: true,
        items: [
          {
            id: "review-forms",
            title: "Review Forms",
            permissions: ["staff.review_forms"]
          },
          {
            id: 'update-signature',
            title: 'Update Signature',
            permissions: ['student.update_signature']
          }

        ],
      },
      {
        title: 'Delegations',
        icon: "UserPlus",
        isActive: true,
        items: [
          {
            id: "manage-delegations",
            title: "Manage Delegations",
            permissions: ['staff.manage_delegations'],
          }
        ]
      },
    ],

    dashboard: {
      defaultView: "",
      title: "Staff Dashboard",
    },

    permissions: {
      canEditUsers: false,
      canCreateUsers: false,
      canToggleUserStatus: false,
      canUpdateSignature: true,
      canManageDelegations: true
    }
  },

  student: {
    sidebar: [
      {
        title: "Form Management",
        icon: "File",
        isActive: true,
        items: [
          {
            id: "submit-forms",
            title: "Submit Forms",
            permissions: ["student.submit_forms"]
          },
          // for drafts and status
          {
            id: 'view-forms',
            title: "View Forms",
            permissions: ["student.view_forms"]
          },
          {
            id: 'update-signature',
            title: 'Update Signature',
            permissions: ['student.update_signature']
          }
        ],
      },
      {
        title: "Account",
        icon: "User",
        isActive: true,
        items: [
          {
            id: "profile",
            title: "Profile Settings",
            permissions: ["student.edit_profile"]
          }
        ]
      }
    ],
    dashboard: {
      defaultView: "",
      title: "Student Dashboard",
    },
    permissions: {
      canEditUsers: false,
      canCreateUsers: false,
      canToggleUserStatus: false,
      canUpdateSignature: true,
      student: {
        submit_forms: true,
        view_forms: true,
        edit_profile: true
      }
    }
  }
}


/**
 * Dashboard configuration object
 * Maintains the current configuration and provides methods
 * to access and modify dashboard settings
 */
const dashboardConfig = {
  // Default configuration
  config: {
    user: {
      role: "student",
      id: null,
      username: "",
      email: "",
      fullName: "",
      isActive: true,
      isStaff: false,
      isSuperUser: false
    },
    ...roleConfigs.student  // Default to student role
  },

  // Method to update the config
  update(configUpdater) {
    // Support both function and object updates
    if (typeof configUpdater === 'function') {
      this.config = configUpdater(this.config);
    } else {
      this.config = { ...this.config, ...configUpdater };
    }
    return this.config;
  },

  // Method to get the current config
  getConfig() {
    return this.config;
  },

  // Check if user has permission
  hasPermission(permission) {
    const { permissions } = this.config;
    return permissions && permissions[permission] === true;
  },

  // Get sidebar config
  getSidebar() {
    return this.config.sidebar || [];
  },

  // Get dashboard config
  getDashboard() {
    pretty_log(`RECEIVED in Get Dashboard ${JSON.stringify(this.config.dashboard, null, 4)}`, "DEBUG")
    return this.config.dashboard || { defaultView: "", title: "Dashboard" };
  }
};


/**
 * Initialize dashboard configuration with user data
 * Sets up the correct role-based configuration and permissions
 */
export const initializeConfig = (userData) => {
  pretty_log("Initializing User Config for Dashboard", "INFO")

  // Extract user properties
  const id = userData.id;
  const username = userData.username;
  const email = userData.email;
  const fName = userData.first_name;
  const lName = userData.last_name;
  const phone = userData.phone;
  const userRole = userData.role;
  const active = userData.is_active;
  const staff = userData.is_staff;
  const createdAt = userData.created_at;
  const updatedAt = userData.updated_at;
  const superuser = userData.is_superuser;

  // Update configuration with user data and role-specific settings
  dashboardConfig.update({
    user: {
      id,
      username,
      email,
      fullName: `${fName || ''} ${lName || ''}`.trim(),
      phone,
      role: userRole,
      isActive: active,
      isStaff: staff,
      createdAt,
      updatedAt,
      isSuperUser: superuser
    },
    // Apply role-specific config with fallback to student role (since it has the lowest privileges)
    ...roleConfigs[userRole] || roleConfigs.student // Fallback to student if role is unknown
  });

  return dashboardConfig;
};

export default dashboardConfig;
