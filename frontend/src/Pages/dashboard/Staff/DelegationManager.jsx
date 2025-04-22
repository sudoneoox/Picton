import React, { useState, useEffect } from 'react';
import { api } from "@/api/api.js";
import { pretty_log } from "@/api/common_util";
import { useToast } from "@/components/ToastNotification";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const DelegationManager = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [delegations, setDelegations] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all", // all, active, upcoming, expired
    unit: "all",
  });
  const [analytics, setAnalytics] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    expired: 0,
    byUnit: {},
  });
  const [formData, setFormData] = useState({
    unit: "",
    delegate: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    reason: "",
  });

  // Add state for existing delegations warning
  const [existingDelegations, setExistingDelegations] = useState([]);
  const [showExistingDelegationsWarning, setShowExistingDelegationsWarning] = useState(false);

  const itemsPerPage = 10;

  // Add filter function first
  const filteredDelegations = delegations.filter(delegation => {
    const now = new Date();
    const startDate = new Date(delegation.start_date);
    const endDate = new Date(delegation.end_date);
    
    // Search match
    const searchMatch = 
      delegation.delegator_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delegation.delegate_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delegation.unit_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delegation.reason?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status match
    let statusMatch = true;
    if (filters.status !== "all") {
      switch (filters.status) {
        case "active":
          statusMatch = startDate <= now && endDate >= now;
          break;
        case "upcoming":
          statusMatch = startDate > now;
          break;
        case "expired":
          statusMatch = endDate < now;
          break;
      }
    }

    // Unit match
    const unitMatch = filters.unit === "all" || delegation.unit.toString() === filters.unit;

    return searchMatch && statusMatch && unitMatch;
  });

  // Calculate pagination after filtered delegations
  const totalPages = Math.ceil(filteredDelegations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDelegations = filteredDelegations.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Add function to update analytics
  const updateAnalytics = (delegationsData) => {
    const now = new Date();
    const stats = {
      total: delegationsData.length,
      active: 0,
      upcoming: 0,
      expired: 0,
      byUnit: {},
    };

    delegationsData.forEach(delegation => {
      const startDate = new Date(delegation.start_date);
      const endDate = new Date(delegation.end_date);

      if (endDate < now) {
        stats.expired++;
      } else if (startDate > now) {
        stats.upcoming++;
      } else {
        stats.active++;
      }

      // Count by unit
      const unitName = delegation.unit_name || 'Unknown Unit';
      stats.byUnit[unitName] = (stats.byUnit[unitName] || 0) + 1;
    });

    setAnalytics(stats);
  };

  // Add a function to fetch delegations
  const fetchDelegations = async () => {
    try {
      const delegationsData = await api.staff.getActiveDelegations();
      setDelegations(delegationsData);
    } catch (error) {
      pretty_log(`Error fetching delegations: ${error}`, "ERROR");
      showToast({ error: "Failed to refresh delegations" }, "error");
    }
  };

  // Modify useEffect to use the new function
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try to get user's units first, fall back to all units if needed
        let unitsData;
        try {
          unitsData = await api.staff.getMyUnits();
          pretty_log("Staff units response:", "INFO");
          pretty_log(unitsData, "INFO");
        } catch (error) {
          pretty_log("Falling back to all organizational units", "INFO");
          unitsData = await api.admin.getOrganizationalUnits();
          pretty_log("All units response:", "INFO");
          pretty_log(unitsData, "INFO");
        }

        const [delegationsData, usersData] = await Promise.all([
          api.staff.getActiveDelegations(),
          api.admin.getUsers()
        ]);

        // Debug logging for units data structure
        pretty_log("Final units data structure:", "INFO");
        if (Array.isArray(unitsData)) {
          pretty_log(`Number of units: ${unitsData.length}`, "INFO");
          if (unitsData.length > 0) {
            pretty_log("First unit structure:", "INFO");
            pretty_log(unitsData[0], "INFO");
          }
        } else {
          pretty_log("Units data is not an array:", "INFO");
          pretty_log(typeof unitsData, "INFO");
        }

        if (!unitsData || unitsData.length === 0) {
          showToast({ error: "No units available for delegation" }, "error");
        }

        setDelegations(delegationsData);
        setUnits(unitsData || []); // Ensure we set an empty array if null/undefined
        setUsers(usersData);
        updateAnalytics(delegationsData);
      } catch (error) {
        pretty_log(`Error fetching delegation data: ${error}`, "ERROR");
        showToast({ error: "Failed to load delegation data" }, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]); // Add showToast to dependencies

  // Debug: Log whenever units state changes
  useEffect(() => {
    pretty_log("Units state updated:", "INFO");
    pretty_log(units, "INFO");
  }, [units]);

  // Function to check for existing delegations
  const checkExistingDelegations = async (unitId, startDate, endDate) => {
    try {
      const activeDelegations = await api.staff.getActiveDelegations();
      const overlapping = activeDelegations.filter(d => 
        d.unit.toString() === unitId.toString() &&
        d.is_active &&
        new Date(d.end_date) >= new Date(startDate) &&
        new Date(d.start_date) <= new Date(endDate)
      );
      
      setExistingDelegations(overlapping);
      setShowExistingDelegationsWarning(overlapping.length > 0);
      return overlapping.length > 0;
    } catch (error) {
      pretty_log(`Error checking existing delegations: ${error}`, "ERROR");
      return false;
    }
  };

  // Update form data handler to check for existing delegations
  const handleFormDataChange = async (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Check for existing delegations when all date and unit fields are filled
    if (newFormData.unit && newFormData.start_date && newFormData.end_date) {
      await checkExistingDelegations(
        newFormData.unit,
        newFormData.start_date,
        newFormData.end_date
      );
    }
  };

  const handleCreateDelegation = async () => {
    // Add validation for required fields
    if (!formData.unit || !formData.delegate || !formData.start_date || !formData.end_date || !formData.reason) {
      showToast({ error: "Please fill in all required fields" }, "error");
      return;
    }

    // Validate dates
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const now = new Date();

    // Set hours to 0 for accurate date comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    if (startDate < now) {
      showToast({ error: "Start date cannot be in the past" }, "error");
      return;
    }

    if (endDate <= startDate) {
      showToast({ error: "End date must be after start date" }, "error");
      return;
    }

    // Convert dates to ISO format with time and add delegator field
    const requestData = {
      ...formData,
      start_date: new Date(formData.start_date + "T00:00:00.000Z").toISOString(),
      end_date: new Date(formData.end_date + "T23:59:59.999Z").toISOString(),
      // The delegator field will be set by the backend to the current user
      delegator: null
    };

    // Debug log the request data
    pretty_log("Creating delegation with data:", "DEBUG");
    pretty_log(JSON.stringify(requestData, null, 2), "DEBUG");

    try {
      await api.staff.createDelegation(requestData);
      await fetchDelegations(); // Refresh the delegations list
      setShowCreateDialog(false);
      showToast({ message: "Delegation created successfully" }, "success");
      resetForm();
    } catch (error) {
      pretty_log("Delegation creation error details:", "ERROR");
      pretty_log(error.details || error, "ERROR");
      
      // Display specific error message if available
      const errorMessage = error.details?.error || error.details?.detail || error.message || "Failed to create delegation";
      showToast({ error: errorMessage }, "error");
    }
  };

  const handleDeleteDelegation = async (delegationId) => {
    try {
      await api.staff.cancelDelegation(delegationId);
      await fetchDelegations(); // Refresh the delegations list
      showToast({ message: "Delegation cancelled successfully" }, "success");
    } catch (error) {
      const errorMessage = error.details?.error || error.message || "Failed to cancel delegation";
      showToast({ error: errorMessage }, "error");
    }
  };

  const resetForm = () => {
    setFormData({
      unit: "",
      delegate: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
      reason: "",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Update the DelegationStatus component
  const DelegationStatus = ({ delegation }) => {
    const now = new Date();
    const startDate = new Date(delegation.start_date);
    const endDate = new Date(delegation.end_date);

    if (endDate < now) {
      return <Badge variant="secondary">Expired</Badge>;
    } else if (startDate > now) {
      return <Badge variant="secondary">Upcoming</Badge>;
    } else {
      return <Badge variant="secondary">Active</Badge>;
    }
  };

  // Get future dated users only for delegation
  const getEligibleDelegates = () => {
    return users.filter(user => {
      // Must be active user
      if (!user.is_active) return false;

      // Cannot delegate to yourself
      if (user.id === parseInt(formData.delegator)) return false;

      // Only staff or admin can be delegates
      return (user.role === "staff" || user.role === "admin");
    });
  };

  // Update the units rendering to handle potential different data structures
  const renderUnitOptions = () => {
    if (!Array.isArray(units)) {
      return <SelectItem value="" disabled>Error loading units</SelectItem>;
    }

    if (units.length === 0) {
      return (
        <>
          <SelectItem value="" disabled>No units available</SelectItem>
          <SelectItem value="" disabled className="text-muted-foreground text-xs italic">
            Units must be created by an admin and assigned to you as an approver
          </SelectItem>
        </>
      );
    }

    return units.map((unit) => {
      const id = unit.id?.toString() || unit.unit_id?.toString();
      const name = unit.name || unit.unit_name;
      
      if (!id || !name) {
        pretty_log("Invalid unit structure:", "WARNING");
        pretty_log(unit, "WARNING");
        return null;
      }

      return (
        <SelectItem key={id} value={id}>
          {name}
        </SelectItem>
      );
    }).filter(Boolean);
  };

  // Add export function
  const exportToCSV = () => {
    // Prepare CSV data
    const headers = [
      "Delegator",
      "Delegate",
      "Unit",
      "Start Date",
      "End Date",
      "Status",
      "Reason",
      "Created At"
    ];

    const csvData = filteredDelegations.map(delegation => {
      const now = new Date();
      const startDate = new Date(delegation.start_date);
      const endDate = new Date(delegation.end_date);
      
      let status = "Active";
      if (endDate < now) {
        status = "Expired";
      } else if (startDate > now) {
        status = "Upcoming";
      }

      return [
        delegation.delegator_name,
        delegation.delegate_name,
        delegation.unit_name,
        formatDate(delegation.start_date),
        formatDate(delegation.end_date),
        status,
        delegation.reason,
        formatDate(delegation.created_at)
      ];
    });

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
    link.setAttribute("download", `delegations-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Delegations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Delegations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Delegations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.upcoming}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired Delegations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search delegations..."
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
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.unit}
          onValueChange={(value) => setFilters({ ...filters, unit: value })}
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
          setShowCreateDialog(true);
        }}>
          Create Delegation
        </Button>
      </div>

      {/* Update the table to use filtered delegations and include status */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Delegator</TableHead>
            <TableHead>Delegate</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </TableCell>
            </TableRow>
          ) : currentDelegations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                No delegations found
              </TableCell>
            </TableRow>
          ) : (
            currentDelegations.map((delegation) => (
              <TableRow key={delegation.id}>
                <TableCell>{delegation.delegator_name}</TableCell>
                <TableCell>{delegation.delegate_name}</TableCell>
                <TableCell>{delegation.unit_name}</TableCell>
                <TableCell>{formatDate(delegation.start_date)}</TableCell>
                <TableCell>{formatDate(delegation.end_date)}</TableCell>
                <TableCell>
                  <DelegationStatus delegation={delegation} />
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={delegation.reason}>
                  {delegation.reason}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteDelegation(delegation.id)}
                  >
                    Cancel
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add Pagination */}
      {filteredDelegations.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredDelegations.length)} of {filteredDelegations.length} entries
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Delegation</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new delegation. All fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {showExistingDelegationsWarning && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Warning: There are existing delegations for this period:
                    </p>
                    <ul className="mt-2 text-sm text-yellow-700">
                      {existingDelegations.map(d => (
                        <li key={d.id}>
                          • {d.delegator_name} → {d.delegate_name} 
                          ({new Date(d.start_date).toLocaleDateString()} to {new Date(d.end_date).toLocaleDateString()})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">
                Unit <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleFormDataChange("unit", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {renderUnitOptions()}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delegate" className="text-right">
                Delegate To <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.delegate}
                onValueChange={(value) => handleFormDataChange("delegate", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {getEligibleDelegates().map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.first_name} {user.last_name} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_date" className="text-right">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => handleFormDataChange("start_date", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_date" className="text-right">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                id="end_date"
                value={formData.end_date}
                onChange={(e) => handleFormDataChange("end_date", e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => handleFormDataChange("reason", e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDelegation}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DelegationManager;
