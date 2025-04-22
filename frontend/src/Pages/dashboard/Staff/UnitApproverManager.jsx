import React, { useState, useEffect } from "react";
import { api } from "@/api/api.js";
import { useToast } from "@/components/ToastNotification";
import { pretty_log } from "@/api/common_util";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, MoreVertical, Download } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const UnitApproverManager = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [approvers, setApprovers] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    role: null,
    status: "all",
    unit: null,
  });
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalApprovers: 0,
    activeApprovers: 0,
    byUnit: {},
    byRole: {},
  });
  const [formData, setFormData] = useState({
    unit: "",
    user: "",
    role: "",
    is_organization_wide: false,
    is_active: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [approversData, unitsData, usersData] = await Promise.all([
          api.admin.getUnitApprovers(),
          api.admin.getOrganizationalUnits(),
          api.admin.getUsers(),
        ]);
        setApprovers(approversData);
        setUnits(unitsData);
        setUsers(usersData.results || usersData);
      } catch (error) {
        pretty_log(`Error fetching approver data: ${error}`, "ERROR");
        showToast({ error: "Failed to load approver data" }, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Update analytics whenever approvers change
    updateAnalytics();
  }, [approvers]);

  const updateAnalytics = () => {
    const stats = {
      totalApprovers: approvers.length,
      activeApprovers: approvers.filter(a => a.is_active).length,
      byUnit: {},
      byRole: {},
    };

    approvers.forEach(approver => {
      // Count by unit
      stats.byUnit[approver.unit_name] = (stats.byUnit[approver.unit_name] || 0) + 1;
      // Count by role
      stats.byRole[approver.role] = (stats.byRole[approver.role] || 0) + 1;
    });

    setAnalytics(stats);
  };

  const filteredApprovers = approvers.filter(approver => {
    const matchesSearch = 
      approver.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approver.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approver.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilters = 
      (filters.role === null || approver.role === filters.role) &&
      (filters.unit === null || approver.unit.toString() === filters.unit) &&
      (filters.status === "all" || 
       (filters.status === "active" && approver.is_active) ||
       (filters.status === "inactive" && !approver.is_active));

    return matchesSearch && matchesFilters;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredApprovers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentApprovers = filteredApprovers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Add debug logging to help us understand the data
  useEffect(() => {
    if (filters.unit) {
      pretty_log("Selected unit filter:", "DEBUG");
      pretty_log(filters.unit, "DEBUG");
      pretty_log("Available approvers:", "DEBUG");
      pretty_log(approvers.map(a => ({ id: a.id, unit: a.unit, unit_name: a.unit_name })), "DEBUG");
    }
  }, [filters.unit, approvers]);

  const handleCreateApprover = async () => {
    try {
      const newApprover = await api.admin.createUnitApprover(formData);
      setApprovers([...approvers, newApprover]);
      setDialogOpen(false);
      showToast({ message: "Unit approver created successfully" }, "success");
      resetForm();
    } catch (error) {
      showToast({ error: error.message || "Failed to create approver" }, "error");
    }
  };

  const handleUpdateApprover = async () => {
    try {
      const updatedApprover = await api.admin.updateUnitApprover(
        selectedApprover.id,
        formData
      );
      setApprovers(approvers.map(approver =>
        (approver.id === updatedApprover.id ? updatedApprover : approver)
      ));
      setDialogOpen(false);
      showToast({ message: "Unit approver updated successfully" }, "success");
      resetForm();
    } catch (error) {
      showToast({ error: error.message || "Failed to update approver" }, "error");
    }
  };

  const handleDeleteApprover = async (approverId) => {
    if (!window.confirm("Are you sure you want to delete this approver?")) {
      return;
    }

    try {
      await api.admin.deleteUnitApprover(approverId);
      setApprovers(approvers.filter(approver => approver.id !== approverId));
      showToast({ message: "Unit approver deleted successfully" }, "success");
    } catch (error) {
      showToast({ error: error.message || "Failed to delete approver" }, "error");
    }
  };

  const resetForm = () => {
    setFormData({
      unit: "",
      user: "",
      role: "",
      is_organization_wide: false,
      is_active: true,
    });
    setSelectedApprover(null);
  };

  const openEditDialog = (approver) => {
    setSelectedApprover(approver);
    setFormData({
      unit: approver.unit,
      user: approver.user,
      role: approver.role,
      is_organization_wide: approver.is_organization_wide,
      is_active: approver.is_active,
    });
    setDialogOpen(true);
  };

  const handleBatchAction = async (action) => {
    if (selectedApprovers.length === 0) {
      showToast({ error: "Please select approvers first" }, "error");
      return;
    }

    try {
      switch (action) {
        case "activate":
          await Promise.all(
            selectedApprovers.map(id => 
              api.admin.updateUnitApprover(id, { is_active: true })
            )
          );
          showToast({ message: "Selected approvers activated" }, "success");
          break;
        case "deactivate":
          await Promise.all(
            selectedApprovers.map(id => 
              api.admin.updateUnitApprover(id, { is_active: false })
            )
          );
          showToast({ message: "Selected approvers deactivated" }, "success");
          break;
        case "delete":
          if (window.confirm("Are you sure you want to delete the selected approvers?")) {
            await Promise.all(
              selectedApprovers.map(id => api.admin.deleteUnitApprover(id))
            );
            showToast({ message: "Selected approvers deleted" }, "success");
          }
          break;
      }
      await fetchData();
      setSelectedApprovers([]);
    } catch (error) {
      showToast({ error: error.message || "Failed to perform batch action" }, "error");
    }
  };

  const exportToCSV = () => {
    // Prepare CSV data
    const headers = [
      "User",
      "Unit",
      "Role",
      "Scope",
      "Status",
      "Created At",
      "Last Modified"
    ];

    const csvData = filteredApprovers.map(approver => [
      approver.user_name,
      approver.unit_name,
      approver.role,
      approver.is_organization_wide ? "Organization-wide" : "Unit-specific",
      approver.is_active ? "Active" : "Inactive",
      approver.created_at || "N/A",
      approver.updated_at || "N/A"
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => 
        typeof cell === "string" && cell.includes(",") ? 
        `"${cell}"` : cell
      ).join(","))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `unit-approvers-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analytics Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-background p-4 rounded-lg border">
          <h3 className="font-medium">Total Approvers</h3>
          <p className="text-2xl">{analytics.totalApprovers}</p>
        </div>
        <div className="bg-background p-4 rounded-lg border">
          <h3 className="font-medium">Active Approvers</h3>
          <p className="text-2xl">{analytics.activeApprovers}</p>
        </div>
        <div className="bg-background p-4 rounded-lg border">
          <h3 className="font-medium">Units Covered</h3>
          <p className="text-2xl">{Object.keys(analytics.byUnit).length}</p>
        </div>
        <div className="bg-background p-4 rounded-lg border">
          <h3 className="font-medium">Roles</h3>
          <p className="text-2xl">{Object.keys(analytics.byRole).length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search approvers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.unit || "all"}
          onValueChange={(value) => setFilters({ ...filters, unit: value === "all" ? null : value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id.toString()}>
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={() => {
          resetForm();
          setDialogOpen(true);
        }}>
          Add Approver
        </Button>
      </div>

      {/* Batch Actions */}
      {selectedApprovers.length > 0 && (
        <div className="flex items-center space-x-2 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedApprovers.length} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBatchAction("activate")}
          >
            Activate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBatchAction("deactivate")}
          >
            Deactivate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleBatchAction("delete")}
          >
            Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  selectedApprovers.length === filteredApprovers.length &&
                  filteredApprovers.length > 0
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedApprovers(filteredApprovers.map(a => a.id));
                  } else {
                    setSelectedApprovers([]);
                  }
                }}
              />
            </TableHead>
            <TableHead>User</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7}>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </TableCell>
            </TableRow>
          ) : currentApprovers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                No approvers found
              </TableCell>
            </TableRow>
          ) : (
            currentApprovers.map((approver) => (
              <TableRow key={approver.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedApprovers.includes(approver.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedApprovers([...selectedApprovers, approver.id]);
                      } else {
                        setSelectedApprovers(
                          selectedApprovers.filter(id => id !== approver.id)
                        );
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">{approver.user_name}</TableCell>
                <TableCell>{approver.unit_name}</TableCell>
                <TableCell>{approver.role}</TableCell>
                <TableCell>
                  {approver.is_organization_wide ? 'Organization-wide' : 'Unit-specific'}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    approver.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {approver.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(approver)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteApprover(approver.id)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add Pagination */}
      {filteredApprovers.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredApprovers.length)} of {filteredApprovers.length} entries
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Show first page, last page, current page, and pages around current page
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  (pageNumber === currentPage - 2 && pageNumber > 2) ||
                  (pageNumber === currentPage + 2 && pageNumber < totalPages - 1)
                ) {
                  return <PaginationEllipsis key={pageNumber} />;
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedApprover ? "Edit Unit Approver" : "Add Unit Approver"}
            </DialogTitle>
            <DialogDescription>
              {selectedApprover
                ? "Update the approver details below."
                : "Add a new approver for an organizational unit."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit || "select-unit"}
                onValueChange={(value) => setFormData({ ...formData, unit: value === "select-unit" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select-unit" disabled>Select a unit</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id.toString()}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select
                value={formData.user || "select-user"}
                onValueChange={(value) => setFormData({ ...formData, user: value === "select-user" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select-user" disabled>Select a user</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Enter approver role"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_organization_wide"
                checked={formData.is_organization_wide}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_organization_wide: checked })
                }
              />
              <Label htmlFor="is_organization_wide">Organization-wide Approver</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={selectedApprover ? handleUpdateApprover : handleCreateApprover}
            >
              {selectedApprover ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnitApproverManager; 