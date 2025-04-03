/**
 * UserProfileSettings Component
 * Handles user profile management including:
 * - Email updates
 * - Username changes
 * - Password updates
 * - Dark mode toggle
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ToastNotification";
import { api } from "@/api/api";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/ThemeProvider";
import { UserProfileSettingsProps } from "@/types/dashboard";

export function UserProfileSettings({ userData, onUpdate }: UserProfileSettingsProps) {
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState<{
    email: boolean;
    username: boolean;
    password: boolean;
  }>({
    email: false,
    username: false,
    password: false,
  });
  const [formData, setFormData] = useState({
    email: userData.email || "",
    username: userData.username || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  /**
   * Handle input field changes
   * @param field - Field name to update
   * @param value - New value for the field
   */
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handle email update submission
   * Validates and sends request to update user's email
   */
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(prev => ({ ...prev, email: true }));
    try {
      await api.auth.updateEmail(formData.email);
      showToast({ message: "Email updated successfully" }, "success");
      onUpdate({ ...userData, email: formData.email });
    } catch (error: any) {
      showToast(
        { error: error.message || "Failed to update email" },
        "error",
        "Email Update Failed"
      );
      console.error("Email update error:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, email: false }));
    }
  };

  /**
   * Handle username update submission
   * Validates and sends request to update user's username
   */
  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(prev => ({ ...prev, username: true }));
    try {
      await api.auth.updateUsername(formData.username);
      showToast({ message: "Username updated successfully" }, "success");
      onUpdate({ ...userData, username: formData.username });
    } catch (error: any) {
      showToast(
        { error: error.message || "Failed to update username" },
        "error",
        "Username Update Failed"
      );
      console.error("Username update error:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, username: false }));
    }
  };

  /**
   * Handle password update submission
   * Validates password match and sends request to update user's password
   */
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      showToast({ error: "New passwords do not match" }, "error");
      return;
    }
    setIsLoading(prev => ({ ...prev, password: true }));
    try {
      await api.auth.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      showToast({ message: "Password updated successfully" }, "success");
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      showToast(
        { error: error.message || "Failed to update password" },
        "error",
        "Password Update Failed"
      );
      console.error("Password update error:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, password: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Dark Mode Toggle Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Dark Mode</h2>
          <p className="text-sm text-muted-foreground">Toggle dark mode theme</p>
        </div>
        <Switch
          checked={theme === "dark"}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        />
      </div>

      {/* Email Update Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Email Settings</h2>
        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              disabled={isLoading.email}
            />
          </div>
          <Button type="submit" disabled={isLoading.email}>
            {isLoading.email ? "Updating..." : "Update Email"}
          </Button>
        </form>
      </div>

      {/* Username Update Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Username Settings</h2>
        <form onSubmit={handleUsernameUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              required
              disabled={isLoading.username}
            />
          </div>
          <Button type="submit" disabled={isLoading.username}>
            {isLoading.username ? "Updating..." : "Update Username"}
          </Button>
        </form>
      </div>

      {/* Password Update Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Password Settings</h2>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange("currentPassword", e.target.value)}
              required
              disabled={isLoading.password}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              required
              disabled={isLoading.password}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              required
              disabled={isLoading.password}
            />
          </div>
          <Button type="submit" disabled={isLoading.password}>
            {isLoading.password ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
} 