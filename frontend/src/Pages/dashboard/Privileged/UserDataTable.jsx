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
import EditUserDialog from "@/Pages/dashboard/Privileged/EditUserDialog"
import { useEffect } from "react";

const UserDataTable = ({ userData, onToggleStatus, canToggleStatus = true }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [localUserData, setLocalUserData] = useState(userData)

  const rowsPerPage = 5;

  // Calculate pagination
  const totalPages = Math.ceil(userData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleUsers = userData.slice(startIndex, startIndex + rowsPerPage);

  useEffect(() => {
    setLocalUserData(userData);
  }, [userData])

  // Handle user update from dialog
  const handleUserUpdated = (updatedUser) => {
    setLocalUserData(prevData =>
      prevData.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
  };

  return (
    <div className="w-full">
      <Table>
        <TableCaption>User Management</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                  />
                  <Label htmlFor={`user-status-${user.id}`}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Label>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {/* Pass user to prefill data  */}
                <EditUserDialog user={user} onUserUpdated={handleUserUpdated} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                // delete href="#"
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
                  // delete href="#"
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
      )}
    </div>
  );
};
export default UserDataTable;
