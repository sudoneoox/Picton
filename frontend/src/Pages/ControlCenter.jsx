import React, { useState } from "react";
import EditUserModal from "./EditUserModal.jsx";
//import UserTable from "../Components/UserTable.jsx"; // This is your teammate's component

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
        <div className="flex h-screen bg-gray-100">
            {/*Sidebar Navigation*/}
            <aside ClassName="w-1/5 bg-gray-800 text-white p-6">
                <h1 className="text-2x1 font-bold mb-6">Picton</h1>
                <nav>
                    <ul className="space-y-4">
                        <li><a href="#" className="block p-2 hover:bg-gray-700">Dashboard</a></li>
                        <li><a href="#" className="block p-2 hover:bg-gray-700">Manage Users</a></li>
                        <li><a href="#" className="block p-2 hover:bg-gray-700">Settings</a></li>
                    </ul>
                </nav>
            </aside>

            {/*Main Content*/}
            <main className="flex-1 p-6">
                <h2 className="text-2x1 font-bold mb-6">Admin Control Panel</h2>
                
                {/* User Managment Section*/}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-lg font-semibold mb-2">View Users</h3>
                        <button className="bg-blue-500 text-white px-4 py-4 rounded">Go</button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-lg font-semibold mb-2">Add User</h3>
                        <button className="bg-green-500 text-white px-4 py-4 rounded">Go</button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-lg font-semibold mb-2">Delete User</h3>
                        <button className="bg-red-500 text-white px-4 py-4 rounded">Go</button>
                    </div>
                </div>

                {/* Import the User Table Component */}
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
            </main>
        </div>
    );
};

export default ControlCenter;
