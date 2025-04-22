import React, { useState, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import EditUserDialog from "@/Pages/dashboard/Privileged/EditUserDialog"
import UserCreationForm from "@/Pages/dashboard/Privileged/UserCreationForm"
import { useToast } from "@/components/ToastNotification"
import { admin } from "@/api/admin_dashboard"

const UserDataTable = ({ userData = [], onToggleStatus, canToggleStatus = true, onUserCreated, onUserUpdated }) => {
  const rowsPerPage = 5;
  const [users, setUsers] = useState(userData);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { showToast } = useToast();

  // Update users when userData prop changes
  useEffect(() => {
    setUsers(userData);
    setTotalPages(Math.ceil(userData.length / rowsPerPage));
    setIsLoading(false);
  }, [userData, rowsPerPage]);

  // Calculate pagination
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const visibleUsers = users.slice(startIndex, endIndex);

  // Fetch users function
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await admin.getUsers();
      
      // Handle different response formats
      let fetchedUsers = [];
      if (Array.isArray(response)) {
        fetchedUsers = response;
      } else if (response && typeof response === 'object') {
        if (Array.isArray(response.users)) {
          fetchedUsers = response.users;
        } else if (Array.isArray(response.data)) {
          fetchedUsers = response.data;
        } else {
          fetchedUsers = [response];
        }
      }
      
      setUsers(fetchedUsers);
      setTotalPages(Math.ceil(fetchedUsers.length / rowsPerPage));
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      showToast({ error: err.message || 'Failed to fetch users' }, "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast, rowsPerPage]);

  // Initial fetch on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = useCallback(async () => {
    await fetchUsers();
    setShowCreateDialog(false);
  }, [fetchUsers]);

  const handleUserUpdated = useCallback((updatedUser) => {
    if (updatedUser.deleted) {
      // Remove the deleted user from the local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== updatedUser.id));
      
      // Update total pages
      const remainingUsers = users.length - 1;
      const newTotalPages = Math.ceil(remainingUsers / rowsPerPage);
      setTotalPages(newTotalPages);
      
      // Adjust current page if necessary
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages || 1);
      }
    } else {
      // Update the user in the local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === updatedUser.id ? { ...user, ...updatedUser } : user
        )
      );
    }
  }, [users, currentPage, rowsPerPage]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">User Management</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          Create New User
        </Button>
      </div>

      <div className="relative flex-grow min-h-[500px] border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : visibleUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              visibleUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`user-status-${user.id}`}
                        checked={user.is_active}
                        onCheckedChange={() => onToggleStatus(user.id)}
                        disabled={!canToggleStatus}
                        className="min-w-[36px]"
                      />
                      <Label htmlFor={`user-status-${user.id}`} className="min-w-[60px]">
                        {user.is_active ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <EditUserDialog user={user} onUserUpdated={handleUserUpdated} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                <PaginationItem key={`page-${i + 1}`}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {totalPages > 5 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new user account.
            </DialogDescription>
          </DialogHeader>
          <UserCreationForm 
            open={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            onUserCreated={handleCreateUser}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDataTable;
