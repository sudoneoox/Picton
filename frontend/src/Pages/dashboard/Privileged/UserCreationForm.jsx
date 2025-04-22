import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/components/ToastNotification";
import { admin } from '@/api/admin_dashboard';
import { generateTemporaryPassword } from '../../../utils/passwordUtils';

const FormContent = ({ formData, handleChange, temporaryPassword, handleCopyPassword }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                    Username<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="col-span-3"
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                    Email<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="col-span-3"
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="first_name" className="text-right">
                    First Name<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="col-span-3"
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="last_name" className="text-right">
                    Last Name<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="col-span-3"
                    required
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                    Role<span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange({ target: { name: 'role', value } })}
                    required
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
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="temp_password" className="text-right">
                    Temporary Password
                </Label>
                <div className="col-span-3 flex gap-2">
                    <Input
                        id="temp_password"
                        value={temporaryPassword}
                        readOnly
                        className="flex-grow"
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="icon"
                        onClick={handleCopyPassword}
                        title="Copy password to clipboard"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function UserCreationForm({ open, onClose, onUserCreated }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'student'
    });
    const [temporaryPassword, setTemporaryPassword] = useState(generateTemporaryPassword());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCopyPassword = async () => {
        try {
            await navigator.clipboard.writeText(temporaryPassword);
            showToast({ message: "Password copied to clipboard" }, "success");
        } catch (err) {
            showToast({ error: "Failed to copy password" }, "error");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await admin.createUser({
                ...formData,
                password: temporaryPassword
            });
            showToast({ message: "User created successfully" }, "success");
            
            // Reset form
            setFormData({
                username: '',
                email: '',
                first_name: '',
                last_name: '',
                role: 'student'
            });
            setTemporaryPassword(generateTemporaryPassword());
            
            // Notify parent components with the created user data
            if (onUserCreated) {
                await onUserCreated(response);
            }
            if (onClose) {
                onClose();
            }
        } catch (error) {
            showToast({ error: error.message || "Failed to create user" }, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const dialogContent = (
        <FormContent
            formData={formData}
            handleChange={handleChange}
            temporaryPassword={temporaryPassword}
            handleCopyPassword={handleCopyPassword}
        />
    );

    if (typeof open === 'undefined') {
        return (
            <form onSubmit={handleSubmit} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                {dialogContent}
                <div className="flex justify-end mt-6">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Create User"}
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="px-6">
                {dialogContent}
            </div>
            <DialogFooter className="p-6 pt-4">
                <Button variant="outline" type="button" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create User"}
                </Button>
            </DialogFooter>
        </form>
    );
}