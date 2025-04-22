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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";

const UserDataTable = ({ 
  userData = [], 
  onToggleStatus, 
  canToggleStatus = true, 
  onUserCreated, 
  onUserUpdated, 
  selectedUsers = new Set(), 
  onSelectionChange = () => {},
}) => {
  const rowsPerPage = 5;
  const [users, setUsers] = useState(userData);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { showToast } = useToast();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingUser, setEditingUser] = useState(null);

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

  const handleSort = (key) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const sortedData = [...users].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle special cases
    if (sortConfig.key === 'last_login') {
      aValue = aValue ? new Date(aValue) : new Date(0);
      bValue = bValue ? new Date(bValue) : new Date(0);
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSelectAll = (checked) => {
    if (checked) {
      // Create a new Set with all visible user IDs
      const allIds = new Set(sortedData.map(user => user.id));
      onSelectionChange(allIds);
    } else {
      // Clear all selections
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (checked, userId) => {
    const newSelection = new Set(selectedUsers);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    onSelectionChange(newSelection);
  };

  const renderSortableHeader = (label, key) => (
    <div
      className="flex items-center cursor-pointer"
      onClick={() => handleSort(key)}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </div>
  );

  // Add safety check for selectedUsers in the table header
  const isAllSelected = sortedData.length > 0 && sortedData.every(user => selectedUsers.has(user.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Users ({users.length})
        </h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          Add User
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>{renderSortableHeader('Username', 'username')}</TableHead>
              <TableHead>{renderSortableHeader('Email', 'email')}</TableHead>
              <TableHead>{renderSortableHeader('Role', 'role')}</TableHead>
              <TableHead>{renderSortableHeader('Status', 'is_active')}</TableHead>
              <TableHead>{renderSortableHeader('Last Login', 'last_login')}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((user) => (
                <TableRow key={user?.id || Math.random()}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers?.has(user?.id)}
                      onCheckedChange={(checked) => handleSelectOne(checked, user?.id)}
                      aria-label={`Select ${user?.username || 'user'}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user?.username}</TableCell>
                  <TableCell>{user?.email}</TableCell>
                  <TableCell>
                    {user?.role ? (
                      <Badge variant="secondary">{user.role}</Badge>
                    ) : (
                      <span className="text-muted-foreground">No role</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user?.is_active ? "success" : "secondary"}
                      className={user?.is_active ? "bg-green-100 text-green-800" : ""}
                    >
                      {user?.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user?.last_login ? (
                      <span title={new Date(user.last_login).toLocaleString()}>
                        {new Date(user.last_login).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onToggleStatus?.(user?.id, !user?.is_active)}
                        >
                          {user?.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default UserDataTable;
