import React, { useState, useEffect } from 'react';
import { api } from "@/api/api.js";
import { pretty_log } from "@/api/common_util";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ToastNotification";

const DelegationManager = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [delegations, setDelegations] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    unit: "",
    delegate: "",
    start_date: new Date(),
    end_date: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 1 week
    reason: "",
  });
  const [userData, setUserData] = useState(null);



  const fetchCurrentUser = async () => {
    try {
      const user = await api.auth.getCurrentUser();
      setUserData(user);
    } catch (error) {
      pretty_log(`Error fetching current user: ${error}`, "ERROR");
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [delegationsData, unitsData, usersData] = await Promise.all([
          api.staff.getActiveDelegations(),
          api.staff.getMyUnits(),
          api.admin.getUsers(),
        ]);
        setDelegations(delegationsData);
        setUnits(unitsData);
        setUsers(usersData.results || usersData);
      } catch (error) {
        pretty_log(`Error fetching delegation data: ${error}`, "ERROR");
        showToast({ error: "Failed to load delegation data" }, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchCurrentUser();
  }, []);

  const handleCreateDelegation = async () => {
    try {
      // Validate required fields
      if (!formData.unit) {
        showToast({ error: "Please select a unit" }, "error");
        return;
      }
      if (!formData.delegate) {
        showToast({ error: "Please select a delegate" }, "error");
        return;
      }
      if (!formData.reason) {
        showToast({ error: "Please provide a reason for delegation" }, "error");
        return;
      }

      // Format dates for the API and ensure proper data types
      const apiFormData = {
        unit: typeof formData.unit === 'string' ? parseInt(formData.unit) : formData.unit,
        delegate: typeof formData.delegate === 'string' ? parseInt(formData.delegate) : formData.delegate,
        reason: formData.reason,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString(),
      };

      // Add detailed logging
      pretty_log(`Sending delegation data: ${JSON.stringify(apiFormData)}`, "DEBUG");
      pretty_log(`Unit type: ${typeof apiFormData.unit}, value: ${apiFormData.unit}`, "DEBUG");
      pretty_log(`Delegate type: ${typeof apiFormData.delegate}, value: ${apiFormData.delegate}`, "DEBUG");
      pretty_log(`Start date: ${apiFormData.start_date}`, "DEBUG");
      pretty_log(`End date: ${apiFormData.end_date}`, "DEBUG");

      const newDelegation = await api.staff.createDelegation(apiFormData);
      setDelegations([...delegations, newDelegation]);
      setDialogOpen(false);
      showToast({ message: "Delegation created successfully" }, "success");
      resetForm();
    } catch (error) {
      // Enhanced error handling with more details
      pretty_log(`Delegation creation error detail: ${JSON.stringify(error)}`, "ERROR");
      pretty_log(`Error type: ${typeof error}`, "ERROR");
      pretty_log(`Error message: ${error.message}`, "ERROR");

      if (error.response) {
        pretty_log(`Response status: ${error.response.status}`, "ERROR");
        pretty_log(`Response data: ${JSON.stringify(error.response.data)}`, "ERROR");
      }

      let errorMessage = "Failed to create delegation";

      // Extract detailed error message if available
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }

      showToast({ error: errorMessage }, "error");
    }
  };


  const handleCancelDelegation = async (delegationId) => {
    if (!window.confirm("Are you sure you want to cancel this delegation?")) {
      return;
    }

    try {
      await api.staff.cancelDelegation(delegationId);
      // Update local state
      setDelegations(delegations.map(delegation =>
        delegation.id === delegationId
          ? { ...delegation, is_active: false }
          : delegation
      ));
      showToast({ message: "Delegation canceled successfully" }, "success");
    } catch (error) {
      showToast({ error: error.message || "Failed to cancel delegation" }, "error");
    }
  };

  const resetForm = () => {
    setFormData({
      unit: "",
      delegate: "",
      start_date: new Date(),
      end_date: new Date(new Date().setDate(new Date().getDate() + 7)),
      reason: "",
    });
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "PPP");
  };

  // Render delegation table
  const renderDelegationTable = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    // Filter to show only active delegations first
    const sortedDelegations = [...delegations].sort((a, b) => {
      if (a.is_active && !b.is_active) return -1;
      if (!a.is_active && b.is_active) return 1;
      return new Date(b.start_date) - new Date(a.start_date);
    });

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>Delegated To</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDelegations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                No delegations found
              </TableCell>
            </TableRow>
          ) : (
            sortedDelegations.map((delegation) => (
              <TableRow key={delegation.id}>
                <TableCell className="font-medium">{delegation.unit_name}</TableCell>
                <TableCell>{delegation.delegate_name}</TableCell>
                <TableCell>{formatDate(delegation.start_date)}</TableCell>
                <TableCell>{formatDate(delegation.end_date)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${delegation.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {delegation.is_active ? 'Active' : 'Canceled'}
                  </span>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{delegation.reason}</TableCell>
                <TableCell className="text-right">
                  {delegation.is_active && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelDelegation(delegation.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  // Get future dated users only for delegation

  const getEligibleDelegates = () => {
    return users.filter(user => {
      // Must be active user
      if (!user.is_active) return false;

      // Cannot delegate to yourself
      if (user.id === parseInt(formData.delegator)) return false;

      // Only staff or admin can be delegates
      return user.role === "staff" || user.role === "admin";
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delegation Management</CardTitle>
        <CardDescription>
          Delegate your approval authority to other users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium">My Delegations</h3>
            <p className="text-sm text-muted-foreground">
              Manage your approval delegations
            </p>
          </div>
          <Button onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}>
            Create Delegation
          </Button>
        </div>

        {renderDelegationTable()}

        {/* Create Delegation Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Delegation</DialogTitle>
              <DialogDescription>
                Delegate your approval authority to another user
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="delegation-unit" className="text-right">
                  Unit
                </Label>
                <Select
                  value={formData.unit?.toString() || ""}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    unit: parseInt(value)
                  })}
                >
                  <SelectTrigger id="delegation-unit" className="col-span-3">
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>


              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="delegation-delegate" className="text-right">
                  Delegate To
                </Label>
                <Select
                  value={formData.delegate?.toString() || ""}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    delegate: parseInt(value)
                  })}
                >
                  <SelectTrigger id="delegation-delegate" className="col-span-3">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(user =>
                        // Filter criteria: active user, not current user, staff or admin role
                        user.is_active &&
                        user.id !== (userData?.id || 0) &&
                        (user.role === "staff" || user.role === "admin")
                      )
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.first_name} {user.last_name} ({user.username})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="delegation-start-date" className="text-right">
                  Start Date
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? (
                          format(formData.start_date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => setFormData({
                          ...formData,
                          start_date: date
                        })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="delegation-end-date" className="text-right">
                  End Date
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.end_date ? (
                          format(formData.end_date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => setFormData({
                          ...formData,
                          end_date: date
                        })}
                        initialFocus
                        disabled={(date) => date < formData.start_date}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="delegation-reason" className="text-right">
                  Reason
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="delegation-reason"
                    value={formData.reason}
                    onChange={(e) => setFormData({
                      ...formData,
                      reason: e.target.value
                    })}
                    placeholder="Explain why you're delegating your approval authority"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateDelegation}
                disabled={!formData.unit || !formData.delegate || !formData.reason}
              >
                Create Delegation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DelegationManager;
