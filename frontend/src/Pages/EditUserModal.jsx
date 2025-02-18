import React, { useState } from "react";

const EditUserModal = ({ user, onClose, onSave }) => {
    const [role, setRole] = useState(user.role);
    const [email, setEmail] = useState(user.email);

    const handleSave = () => {
        onSave(user.id, { role, email });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg">
                <h2 className="text-xl font-bold mb-4">Edit User</h2>
                
                <label className="block mb-2">Email:</label>
                <input 
                    className="border p-2 w-full" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />

                <label className="block mt-4 mb-2">Role:</label>
                <select 
                    className="border p-2 w-full" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>

                <div className="flex justify-end mt-4">
                    <button className="bg-gray-300 px-4 py-2 rounded mr-2" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditUserModal;
