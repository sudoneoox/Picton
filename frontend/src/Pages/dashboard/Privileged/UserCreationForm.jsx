import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ToastNotification";
import { api } from "@/api/api";
import { Label } from "@/components/ui/label";

const UserCreationForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        role: 'student',
        first_name: '',
        last_name: ''
    });
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.admin.createUser(formData);
            showToast({ message: "User created successfully" }, "success");
            onSuccess?.();
            // Reset form after successful creation
            setFormData({
                username: '',
                email: '',
                role: 'student',
                first_name: '',
                last_name: ''
            });
        } catch (error) {
            showToast({ error: error.message || "User creation failed" }, "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({...formData, role: value})}
                >
                    <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button type="submit" className="w-full">Create User</Button>
        </form>
    );
};

export default UserCreationForm;