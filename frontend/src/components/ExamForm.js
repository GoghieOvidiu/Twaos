import React, { useState, useEffect } from 'react';
import { TextField, Button, MenuItem, Box } from '@mui/material';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import moment from 'moment';

function ExamForm({ initialDate, initialData, onSubmit, onCancel }) {
  const { token, user } = useAuthStore();
  const [formData, setFormData] = useState({
    course_id: '',
    group_id: '',
    date: initialDate ? moment(initialDate).format('YYYY-MM-DDTHH:mm') : '',
    status: 'PENDING',
    user_id: user?.id || '',
    assistant_user_id: '',
    classroom_id: '',
  });
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, groupsRes, classroomsRes] = await Promise.all([
          axios.get('http://localhost:8080/courses/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/groups/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/classrooms/', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setCourses(coursesRes.data);
        setGroups(groupsRes.data);
        setClassrooms(classroomsRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
    if (initialData) {
      setFormData({
        course_id: initialData.course_id,
        group_id: initialData.group_id,
        date: moment(initialData.date).format('YYYY-MM-DDTHH:mm'),
        status: initialData.status,
        user_id: initialData.user_id,
        assistant_user_id: initialData.assistant_user_id || '',
        classroom_id: initialData.classroom_id,
      });
    }
  }, [initialData, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      date: new Date(formData.date).toISOString(),
      course_id: parseInt(formData.course_id),
      group_id: parseInt(formData.group_id),
      user_id: parseInt(formData.user_id),
      assistant_user_id: formData.assistant_user_id ? parseInt(formData.assistant_user_id) : null,
      classroom_id: parseInt(formData.classroom_id),
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        select
        label="Course"
        name="course_id"
        value={formData.course_id}
        onChange={handleChange}
        fullWidth
      >
        {courses.map(course => (
          <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>
        ))}
      </TextField>
      <TextField
        select
        label="Group"
        name="group_id"
        value={formData.group_id}
        onChange={handleChange}
        fullWidth
      >
        {groups.map(group => (
          <MenuItem key={group.id} value={group.id}>{group.group_nr}</MenuItem>
        ))}
      </TextField>
      <TextField
        label="Date and Time"
        type="datetime-local"
        name="date"
        value={formData.date}
        onChange={handleChange}
        fullWidth
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        select
        label="Status"
        name="status"
        value={formData.status}
        onChange={handleChange}
        fullWidth
      >
        {['PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map(status => (
          <MenuItem key={status} value={status}>{status}</MenuItem>
        ))}
      </TextField>
      <TextField
        label="Assistant User ID (optional)"
        name="assistant_user_id"
        value={formData.assistant_user_id}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        select
        label="Classroom"
        name="classroom_id"
        value={formData.classroom_id}
        onChange={handleChange}
        fullWidth
      >
        {classrooms.map(classroom => (
          <MenuItem key={classroom.id} value={classroom.id}>{classroom.name}</MenuItem>
        ))}
      </TextField>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button type="submit" variant="contained">Save</Button>
        <Button onClick={onCancel} variant="outlined">Cancel</Button>
      </Box>
    </Box>
  );
}

export default ExamForm;