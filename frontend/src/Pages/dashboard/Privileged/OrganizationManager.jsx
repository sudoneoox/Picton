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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

const OrganizationManager = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("units");
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [users, setUsers] = useState([]);
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [approverDialogOpen, setApproverDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedApprover, setSelectedApprover] = useState(null);
  const [unitFormData, setUnitFormData] = useState({
    name: "",
    code: "",
    description: "",
    parent: null,
    level: 0,
    is_active: true,
  });
  const [approverFormData, setApproverFormData] = useState({
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
        const [unitsData, approversData, usersData] = await Promise.all([
          api.admin.getOrganizationalUnits(),
          api.admin.getUnitApprovers(),
          api.admin.getUsers(),
        ]);
        setUnits(unitsData);
        setApprovers(approversData);
        setUsers(usersData.results || usersData);
      } catch (error) {
        pretty_log(`Error fetching organization data: ${error}`, "ERROR");
        showToast({ error: "Failed to load organization data" }, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Unit Handlers
  const handleCreateUnit = async () => {
    try {
      const newUnit = await api.admin.createOrganizationalUnit(unitFormData);
      setUnits([...units, newUnit]);
      setUnitDialogOpen(false);
      showToast({ message: "Organizational unit created successfully" }, "success");
      resetUnitForm();
    } catch (error) {
      showToast({ error: error.message || "Failed to create unit" }, "error");
    }
  };

  const handleUpdateUnit = async () => {
    try {
      const updatedUnit = await api.admin.updateOrganizationalUnit(
        selectedUnit.id,
        unitFormData
      );
      setUnits(units.map(unit => (unit.id === updatedUnit.id ? updatedUnit : unit)));
      setUnitDialogOpen(false);
      showToast({ message: "Organizational unit updated successfully" }, "success");
      resetUnitForm();
    } catch (error) {
      showToast({ error: error.message || "Failed to update unit" }, "error");
    }
  };

  const handleDeleteUnit = async (unitId) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) {
      return;
    }

    try {
      await api.admin.deleteOrganizationalUnit(unitId);
      setUnits(units.filter(unit => unit.id !== unitId));
      showToast({ message: "Organizational unit deleted successfully" }, "success");
    } catch (error) {
      showToast({ error: error.message || "Failed to delete unit" }, "error");
    }
  };

  const resetUnitForm = () => {
    setUnitFormData({
      name: "",
      code: "",
      description: "",
      parent: null,
      level: 0,
      is_active: true,
    });
    setSelectedUnit(null);
  };

  const openEditUnitDialog = (unit) => {
    setSelectedUnit(unit);
    setUnitFormData({
      name: unit.name,
      code: unit.code,
      description: unit.description || "",
      parent: unit.parent,
      level: unit.level,
      is_active: unit.is_active,
    });
    setUnitDialogOpen(true);
  };

  // Approver Handlers
  const handleCreateApprover = async () => {
    try {
      const newApprover = await api.admin.createUnitApprover(approverFormData);
      setApprovers([...approvers, newApprover]);
      setApproverDialogOpen(false);
      showToast({ message: "Unit approver created successfully" }, "success");
      resetApproverForm();
    } catch (error) {
      showToast({ error: error.message || "Failed to create approver" }, "error");
    }
  };

  const handleUpdateApprover = async () => {
    try {
      const updatedApprover = await api.admin.updateUnitApprover(
        selectedApprover.id,
        approverFormData
      );
      setApprovers(approvers.map(approver =>
        (approver.id === updatedApprover.id ? updatedApprover : approver)
      ));
      setApproverDialogOpen(false);
      showToast({ message: "Unit approver updated successfully" }, "success");
      resetApproverForm();
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

  const resetApproverForm = () => {
    setApproverFormData({
      unit: "",
      user: "",
      role: "",
      is_organization_wide: false,
      is_active: true,
    });
    setSelectedApprover(null);
  };

  const openEditApproverDialog = (approver) => {
    setSelectedApprover(approver);
    setApproverFormData({
      unit: approver.unit,
      user: approver.user,
      role: approver.role,
      is_organization_wide: approver.is_organization_wide,
      is_active: approver.is_active,
    });
    setApproverDialogOpen(true);
  };

  // Render Functions
  const renderUnitTable = () => {
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
      <>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Organizational Units</h3>
          <Button onClick={() => {
            resetUnitForm();
            setUnitDialogOpen(true);
          }}>
            Add Unit
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No organizational units found
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell>{unit.code}</TableCell>
                  <TableCell>{unit.level}</TableCell>
                  <TableCell>
                    {unit.parent ? units.find(u => u.id === unit.parent)?.name || unit.parent : 'None'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${unit.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {unit.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditUnitDialog(unit)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUnit(unit.id)}
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
      </>
    );
  };

  const renderApproverTable = () => {
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
      <>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Unit Approvers</h3>
          <Button onClick={() => {
            resetApproverForm();
            setApproverDialogOpen(true);
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
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${approver.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {approver.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditApproverDialog(approver)}
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
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Management</CardTitle>
        <CardDescription>
          Manage organizational units and approvers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="units">Organizational Units</TabsTrigger>
            <TabsTrigger value="approvers">Unit Approvers</TabsTrigger>
          </TabsList>
          <TabsContent value="units">{renderUnitTable()}</TabsContent>
          <TabsContent value="approvers">{renderApproverTable()}</TabsContent>
        </Tabs>

        {/* Unit Dialog */}
        <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUnit ? "Edit Organizational Unit" : "Create Organizational Unit"}
              </DialogTitle>
              <DialogDescription>
                {selectedUnit
                  ? "Update the organizational unit details"
                  : "Add a new organizational unit to the system"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="unit-name"
                  value={unitFormData.name}
                  onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit-code" className="text-right">
                  Code
                </Label>
                <Input
                  id="unit-code"
                  value={unitFormData.code}
                  onChange={(e) => setUnitFormData({ ...unitFormData, code: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="unit-description"
                  value={unitFormData.description}
                  onChange={(e) => setUnitFormData({ ...unitFormData, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit-parent" className="text-right">
                  Parent Unit
                </Label>
                <Select
                  value={unitFormData.parent?.toString() || ""}
                  onValueChange={(value) => setUnitFormData({
                    ...unitFormData,
                    parent: value === "none" ? null : parseInt(value),
                    level: value === "none" ? 0 : (units.find(u => u.id === parseInt(value))?.level || 0) + 1
                  })}
                >
                  <SelectTrigger id="unit-parent" className="col-span-3">
                    <SelectValue placeholder="Select a parent unit (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Root Unit)</SelectItem>
                    {units
                      .filter(u => !selectedUnit || u.id !== selectedUnit.id)
                      .map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit-level" className="text-right">
                  Level
                </Label>
                <Input
                  id="unit-level"
                  type="number"
                  min="0"
                  value={unitFormData.level}
                  onChange={(e) => setUnitFormData({
                    ...unitFormData,
                    level: parseInt(e.target.value)
                  })}
                  className="col-span-3"
                  disabled={unitFormData.parent !== null}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit-active" className="text-right">
                  Active
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="unit-active"
                    checked={unitFormData.is_active}
                    onCheckedChange={(checked) => setUnitFormData({
                      ...unitFormData,
                      is_active: checked
                    })}
                  />
                  <Label htmlFor="unit-active">{unitFormData.is_active ? "Active" : "Inactive"}</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUnitDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={selectedUnit ? handleUpdateUnit : handleCreateUnit}>
                {selectedUnit ? "Update Unit" : "Create Unit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approver Dialog */}
        <Dialog open={approverDialogOpen} onOpenChange={setApproverDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedApprover ? "Edit Unit Approver" : "Create Unit Approver"}
              </DialogTitle>
              <DialogDescription>
                {selectedApprover
                  ? "Update the unit approver details"
                  : "Add a new approver to an organizational unit"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="approver-unit" className="text-right">
                  Unit
                </Label>
                <Select
                  value={approverFormData.unit?.toString() || ""}
                  onValueChange={(value) => setApproverFormData({
                    ...approverFormData,
                    unit: parseInt(value)
                  })}
                >
                  <SelectTrigger id="approver-unit" className="col-span-3">
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
                <Label htmlFor="approver-user" className="text-right">
                  User
                </Label>
                <Select
                  value={approverFormData.user?.toString() || ""}
                  onValueChange={(value) => setApproverFormData({
                    ...approverFormData,
                    user: parseInt(value)
                  })}
                >
                  <SelectTrigger id="approver-user" className="col-span-3">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.first_name} {user.last_name} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="approver-role" className="text-right">
                  Role
                </Label>
                <Input
                  id="approver-role"
                  value={approverFormData.role}
                  onChange={(e) => setApproverFormData({
                    ...approverFormData,
                    role: e.target.value
                  })}
                  className="col-span-3"
                  placeholder="e.g., Department Head, Director, Dean"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="approver-scope" className="text-right">
                  Organization-wide
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="approver-scope"
                    checked={approverFormData.is_organization_wide}
                    onCheckedChange={(checked) => setApproverFormData({
                      ...approverFormData,
                      is_organization_wide: checked
                    })}
                  />
                  <Label htmlFor="approver-scope">
                    {approverFormData.is_organization_wide
                      ? "Can approve across all units"
                      : "Limited to selected unit"
                    }
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="approver-active" className="text-right">
                  Active
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="approver-active"
                    checked={approverFormData.is_active}
                    onCheckedChange={(checked) => setApproverFormData({
                      ...approverFormData,
                      is_active: checked
                    })}
                  />
                  <Label htmlFor="approver-active">
                    {approverFormData.is_active ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproverDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={selectedApprover ? handleUpdateApprover : handleCreateApprover}>
                {selectedApprover ? "Update Approver" : "Create Approver"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default OrganizationManager;
