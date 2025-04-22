import React, { useState, useCallback, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { UserDataTable } from '../../components/UserDataTable';
import { admin } from '../../services/admin';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await admin.getUsers();
      setUsers(Array.isArray(response) ? response : response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      showToast({ error: err.message || 'Failed to fetch users' }, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserCreated = useCallback(async (newUser) => {
    await fetchUsers();
    showToast({ message: 'User created successfully' }, "success");
  }, [fetchUsers, showToast]);

  const handleUserUpdated = useCallback(async (updatedUser) => {
    if (updatedUser.deleted) {
      showToast({ message: 'User deleted successfully' }, "success");
    } else {
      showToast({ message: 'User updated successfully' }, "success");
    }
    await fetchUsers();
  }, [fetchUsers, showToast]);

  const handleToggleStatus = useCallback(async (userId, isActive) => {
    try {
      await admin.updateUserStatus(userId, isActive);
      await fetchUsers();
      showToast({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` }, "success");
    } catch (err) {
      showToast({ error: err.message || 'Failed to update user status' }, "error");
    }
  }, [fetchUsers, showToast]);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
      <UserDataTable
        userData={users}
        onToggleStatus={handleToggleStatus}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ManageUsers; 