import React, { useState } from "react";
import EditUserModal from "../Components/EditUserModal.jsx";
import UserTable from "../Components/UserTable.jsx"; // This is your teammate's component

const ControlCenter = () => {
    const [editingUser, setEditingUser] = useState(null); // Tracks user being edited

    // Toggle user activation status
    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const response = await fetch(`http://localhost:8000/api/users/${userId}/toggle-status/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !currentStatus }),
            });

            if (!response.ok) {
                throw new Error("Failed to update user status");
            }

            const updatedUser = await response.json();
            console.log("User status updated:", updatedUser);
            // Notify the user table to refresh data
        } catch (error) {
            console.error("Error updating user status:", error);
        }
    };

    // Delete user
    const deleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            const response = await fetch(`http://localhost:8000/api/users/${userId}/delete/`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete user");
            }

            console.log(`User ${userId} deleted successfully`);
            // Notify the user table to refresh data
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    // Open the edit user modal
    const handleEditUser = (user) => {
        setEditingUser(user);
    };

    // Save user updates
    const saveUserChanges = async (userId, updatedData) => {
        try {
            const response = await fetch(`http://localhost:8000/api/users/${userId}/update/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                throw new Error("Failed to update user");
            }

            const updatedUser = await response.json();
            console.log("User updated successfully:", updatedUser);
            setEditingUser(null); // Close modal after saving
            // Notify the user table to refresh data
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Control Panel</h1>

            {/* Import the User Table Component (Your teammate's work) */}
            <UserTable 
                onEdit={handleEditUser} 
                onDelete={deleteUser} 
                onToggleStatus={toggleUserStatus} 
                adminRole={"super_admin"} // Hardcoded for now, replace with actual role from API
            />


            {/* Edit User Modal */}
            {editingUser && (
                <EditUserModal 
                    user={editingUser} 
                    onClose={() => setEditingUser(null)} 
                    onSave={saveUserChanges} 
                />
            )}
        </div>
    );
};

export default ControlCenter;
