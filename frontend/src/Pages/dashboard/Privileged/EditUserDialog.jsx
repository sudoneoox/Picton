import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { api } from "@/api/api";
import { useToast } from "@/components/ToastNotification";
import { pretty_log } from "@/api/common_util";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EditUserDialog = ({ user, onUserUpdated }) => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    role: user.role,
  });
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.admin.updateUser(user.id, formData);
      showToast({ message: "User updated successfully" }, "success");
      onUserUpdated(response);
      setOpen(false);
    } catch (error) {
      pretty_log(`Error updating user: ${error}`, "ERROR");
      showToast({ error: error.message || "Failed to update user" }, "error");
    }
  };

  const handleDelete = async () => {
    try {
      await api.admin.deleteUser(user.id);
      showToast({ message: "User deleted successfully" }, "success");
      setDeleteDialogOpen(false);
      setTimeout(() => {
        setOpen(false);
        if (onUserUpdated) {
          onUserUpdated({ ...user, deleted: true });
        }
      }, 100);
    } catch (error) {
      pretty_log(`Error deleting user: ${error}`, "ERROR");
      const errorMessage = error.message || "Failed to delete user";
      
      if (errorMessage.includes("superuser")) {
        showToast(
          { error: "Cannot delete superuser accounts" },
          "error",
          "Permission Denied"
        );
      } else if (errorMessage.includes("own account")) {
        showToast(
          { error: "You cannot delete your own account" },
          "error",
          "Permission Denied"
        );
      } else {
        showToast(
          { error: errorMessage },
          "error",
          "Error"
        );
      }
    }
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      if (!deleteDialogOpen) {
        setOpen(false);
      }
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user's information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first_name" className="text-right">
                  First Name
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_name" className="text-right">
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button type="submit">Save Changes</Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete User
                </Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              account and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditUserDialog;
