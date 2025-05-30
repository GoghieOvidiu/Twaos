import { useState } from 'react';
import { Button, TextField, Box, Typography, MenuItem } from '@mui/material';
// import { useUserStore } from '../store/userStore';

interface UserFormProps {
  initialData?: any;
  onSuccess?: () => void;
}

export default function UserForm({ initialData, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState(initialData || {
    username: '',
    email: '',
    password: '',
    role: 'student'
  });
  // const { createUser, updateUser } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (initialData) {
    //   await updateUser(initialData.id, formData);
    // } else {
    //   await createUser(formData);
    // }
    onSuccess?.();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Typography variant="h6">
        {initialData ? 'Edit User' : 'Create User'}
      </Typography>
      <TextField
        label="Username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        fullWidth
        margin="normal"
        required={!initialData}
      />
      <TextField
        select
        label="Role"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        fullWidth
        margin="normal"
        required
      >
        <MenuItem value="student">Student</MenuItem>
        <MenuItem value="teacher">Teacher</MenuItem>
        <MenuItem value="admin">Admin</MenuItem>
      </TextField>
      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        {initialData ? 'Update' : 'Create'}
      </Button>
    </Box>
  );
}
