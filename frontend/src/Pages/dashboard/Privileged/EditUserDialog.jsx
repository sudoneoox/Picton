
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectGroup, SelectValue } from "@/components/ui/select"
import { api } from "@/api/api.js"
import { useToast } from "@/components/ToastNotification"
import { useState } from "react"
import { useEffect } from "react"
import { pretty_log } from "@/api/common_util.js"

export function EditUserDialog({ user, onUserUpdated }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
  })
  // multiple errors can occur so a dict is better
  const [errors, setErrors] = useState({})
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)


  // initial form data when user prop changes or dialog opens
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        role: user.role || "",
      })
      // clear previous errors
      setErrors({})
    }
  }, [user, open])

  const handleInputChange = ((field, value) => {
    pretty_log(`Input change on ${field}: ${value}`, "DEBUG")
    setFormData((prev) => ({ ...prev, [field]: value }))
    // clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  })

  // API request and error handling 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({})

    try {
      const updatedUser = await api.admin.updateUser(user.id, formData);

      pretty_log(`UpdateUser: Sent Data To API ${user.id} ${formData}`, "DEBUG")

      showToast({ message: "User updated successfully" }, "success");


      // Close dialog if success and notify parent component
      setOpen(false);
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
    } catch (error) {
      console.error("Error updating user:", error);

      // Check if the error response contains field-specific errors
      if (error.errors && typeof error.errors === 'object') {
        setErrors(error.errors);
        // Show the first error in a toast
        const firstErrorField = Object.keys(error.errors)[0];
        const firstErrorMessage = error.errors[firstErrorField][0];
        showToast(
          { error: firstErrorMessage },
          "error",
          "Validation Error"
        );
      } else {
        // Generic error handling
        showToast(
          { error: error.message || "Failed to update user" },
          "error",
          "Error"
        );
      }

      // IMPORTANT: don't close the dialog here, to allow the user to fix the errors
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to the user here. Click Save when finished
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <div className="col-span-3">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className={`${errors.username ? "border-red-500" : ""}`}
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username[0]}</p>
                )}
              </div>            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email[0]}</p>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <div className="col-span-3">
              <Select
                id="role"
                // value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue value={formData.role} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="admin"> Admin </SelectItem>
                    <SelectItem value="staff"> Staff </SelectItem>
                    <SelectItem value="student"> Student </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-5">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditUserDialog
