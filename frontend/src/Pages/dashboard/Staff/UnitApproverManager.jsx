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

const UnitApproverManager = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [approvers, setApprovers] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState(null);
  const [formData, setFormData] = useState({
    unit: "",
    user: "",
    role: "",
    is_organization_wide: false,
    is_active: true,
  });

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
      <div className="flex justify-end">
        <Button onClick={() => {
          resetForm();
          setDialogOpen(true);
        }}>
          Add Approver
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                No unit approvers found
              </TableCell>
            </TableRow>
          ) : (
            approvers.map((approver) => (
              <TableRow key={approver.id}>
                <TableCell className="font-medium">{approver.user_name}</TableCell>
                <TableCell>{approver.unit_name}</TableCell>
                <TableCell>{approver.role}</TableCell>
                <TableCell>
                  {approver.is_organization_wide ? 'Organization-wide' : 'Unit-specific'}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${approver.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {approver.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(approver)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteApprover(approver.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select
                value={formData.user}
                onValueChange={(value) => setFormData({ ...formData, user: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
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