import React, { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ToastNotification';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, UserPlus, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserDataTable } from './UserDataTable';
import { api } from "@/api/api";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
  });
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [analytics, setAnalytics] = useState({
    total: 0,
    active: 0,
    byRole: {},
    recentlyActive: 0,
    pendingApprovals: 0,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersResponse, approvalsResponse] = await Promise.all([
        api.admin.getUsers(),
        api.staff.getPendingApprovals(),
      ]);
      
      const userData = Array.isArray(usersResponse) ? usersResponse : usersResponse.data || [];
      setUsers(userData);
      
      // Update analytics
      const stats = {
        total: userData.length,
        active: userData.filter(u => u.is_active).length,
        byRole: {},
        recentlyActive: userData.filter(u => {
          const lastActive = new Date(u.last_login || u.date_joined);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return lastActive >= thirtyDaysAgo;
        }).length,
        pendingApprovals: approvalsResponse?.length || 0,
      };

      // Calculate users by role
      userData.forEach(user => {
        if (user.role) {
          stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
        }
      });

      setAnalytics(stats);
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
      await api.admin.updateUserStatus(userId, isActive);
      await fetchUsers();
      showToast({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` }, "success");
    } catch (err) {
      showToast({ error: err.message || 'Failed to update user status' }, "error");
    }
  }, [fetchUsers, showToast]);

  const handleBulkStatusChange = async (isActive) => {
    try {
      const promises = Array.from(selectedUsers).map(userId =>
        api.admin.updateUserStatus(userId, isActive)
      );
      await Promise.all(promises);
      await fetchUsers();
      setSelectedUsers(new Set());
      showToast({
        message: `Successfully ${isActive ? 'activated' : 'deactivated'} ${selectedUsers.size} users`
      }, "success");
    } catch (err) {
      showToast({ error: err.message || 'Failed to update users' }, "error");
    }
  };

  const handleExport = () => {
    const exportData = filteredUsers.map(user => ({
      'ID': user.id,
      'Username': user.username,
      'Email': user.email,
      'Role': user.role || 'N/A',
      'Status': user.is_active ? 'Active' : 'Inactive',
      'Last Login': user.last_login ? new Date(user.last_login).toLocaleString() : 'Never',
      'Date Joined': new Date(user.date_joined).toLocaleString(),
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(value => 
        `"${String(value).replace(/"/g, '""')}"`
      ).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSelectionChange = useCallback((newSelection) => {
    // Ensure we're working with a Set
    setSelectedUsers(new Set(Array.from(newSelection)));
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const searchMatch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role || "").toLowerCase().includes(searchQuery.toLowerCase());

    const roleMatch = filters.role === "all" || user.role === filters.role;
    const statusMatch = filters.status === "all" || 
      (filters.status === "active" ? user.is_active : !user.is_active);

    return searchMatch && roleMatch && statusMatch;
  });

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.active} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(analytics.byRole).length}</div>
            <p className="text-xs text-muted-foreground">
              Most common: {Object.entries(analytics.byRole)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recently Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentlyActive}</div>
            <p className="text-xs text-muted-foreground">
              in last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              across all users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={filters.role}
            onValueChange={(value) => setFilters({ ...filters, role: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.keys(analytics.byRole).map((role) => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          {selectedUsers.size > 0 && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleBulkStatusChange(true)}
              >
                Activate Selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkStatusChange(false)}
              >
                Deactivate Selected
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredUsers.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* User Table */}
      <UserDataTable
        userData={filteredUsers}
        onToggleStatus={handleToggleStatus}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
        isLoading={isLoading}
        selectedUsers={selectedUsers}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
};

export default ManageUsers; 