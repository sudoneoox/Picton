import React, { useState } from "react";
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

const UserDataTable = ({ userData = [], onToggleStatus, canToggleStatus = true, onUserCreated }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const rowsPerPage = 5;

  // Ensure userData is an array
  const dataArray = Array.isArray(userData) ? userData : [];

  // Calculate pagination
  const totalPages = Math.ceil(dataArray.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleUsers = dataArray.slice(startIndex, startIndex + rowsPerPage);

  // Handle user update from dialog
  const handleUserUpdated = (updatedUser) => {
    // If user was deleted, refresh the data
    if (updatedUser.deleted) {
      if (onUserCreated) {
        onUserCreated();
      }
      return;
    }

    // For other updates, update local state
    if (onToggleStatus) {
      onToggleStatus(updatedUser.id);
    }
  };

  // Handle user creation success
  const handleUserCreated = () => {
    setCreateDialogOpen(false);
    if (onUserCreated) {
      onUserCreated();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">User Management</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
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
            {visibleUsers.map((user) => (
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
            ))}
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
                <PaginationItem key={i}>
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
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new user account.
            </DialogDescription>
          </DialogHeader>
          <UserCreationForm onSuccess={handleUserCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDataTable;
