import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, MenuItem } from '@mui/material';
import axios from 'axios';
import useAuthStore from '../store/authStore';

function Profile() {
  const { user, token } = useAuthStore();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    role: user?.role || '',
    type: user?.type || '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8080/users/${user.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Profile updated successfully');
      setError('');
      // Update user in store
      useAuthStore.setState({ user: { ...user, ...formData } });
    } catch (error) {
      setError('Failed to update profile');
      setSuccess('');
      console.error('Update failed:', error);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Profile</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="First Name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Last Name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          fullWidth
          margin="normal"
          select
        >
          {['USER', 'STUDENT', 'TEACHER'].map(type => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </TextField>
        <TextField
  label="Password"
  name="password"
  type="password"
  value={formData.password}
  onChange={handleChange}
  fullWidth
  margin="normal"
/>
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Save Changes
        </Button>
      </form>
    </Box>
  );
}

export default Profile;