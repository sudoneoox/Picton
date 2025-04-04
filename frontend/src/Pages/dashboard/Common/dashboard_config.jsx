import { pretty_log } from "@/api/common_util.js"

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
          },
          {
            id: "create-users",
            title: "Create Users",
            permissions: ["admin.create_users"]
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
      }
    ],
    dashboard: {
      defaultView: "",
      title: "Admin Dashboard"
    },
    permissions: {
      canEditUsers: true,
      canCreateUsers: true,
      canToggleUserStatus: true,
      canManageFormSchemas: true
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
          }
        ],
      }
    ],

    dashboard: {
      defaultView: "",
      title: "Staff Dashboard",
    },

    permissions: {
      canEditUsers: false,
      canCreateUsers: false,
      canToggleUserStatus: false
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
      student: {
        submit_forms: true,
        view_forms: true,
        edit_profile: true
      }
    }
  }
}


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


// function to init config with user data
export const initializeConfig = (userData) => {
  pretty_log("Initializing User Config for Dashboard", "INFO")

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

  // Assign user properties
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
    // Apply role-specific config
    ...roleConfigs[userRole] || roleConfigs.student // Fallback to student if role is unknown
  });

  return dashboardConfig;
};

export default dashboardConfig;
