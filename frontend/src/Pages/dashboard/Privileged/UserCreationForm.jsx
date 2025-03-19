import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ToastNotification";
import { api } from "@/api/api";

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
        } catch (error) {
            showToast({ error: error.message || "User creation failed" }, "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
            />
            <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
            />
            <Input
                label="First Name"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            />
            <Input
                label="Last Name"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            />
            <Select
                label="Role"
                options={[
                    { value: 'student', label: 'Student' },
                    { value: 'staff', label: 'Staff' },
                    { value: 'admin', label: 'Admin' }
                ]}
                value={formData.role}
                onChange={(value) => setFormData({...formData, role: value})}
            />
            <Button type="submit">Create User</Button>
        </form>
    );
};

export default UserCreationForm;