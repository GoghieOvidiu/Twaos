import React, { useState, useEffect } from 'react';
import { TextField, Button, MenuItem, Box } from '@mui/material';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import moment from 'moment';

function ExamForm({ initialDate, initialData, onSubmit, onCancel }) {
  const { token, user } = useAuthStore();
  const [formData, setFormData] = useState({
    group: '',
    asistent: '',
    data: '',
    ora: '',
    sala: ''
  });
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Generate time options in 24-hour format
  const timeOptions = Array.from({ length: 27 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8; // Start from 8 AM
    const minute = (i % 2) * 30;
    if (hour <= 21) { // Only include times up to 9 PM
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    return null;
  }).filter(time => time !== null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, groupsRes, classroomsRes, facultiesRes] = await Promise.all([
          axios.get('http://localhost:8080/courses/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/groups/complete', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/classrooms/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/faculties/', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setCourses(coursesRes.data);
        setGroups(groupsRes.data);
        setClassrooms(classroomsRes.data);
        setFaculties(facultiesRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
    if (initialData) {
      setFormData({
        group: initialData.group_id,
        asistent: initialData.asistent || '',
        data: moment(initialData.date).format('YYYY-MM-DD'),
        ora: moment(initialData.date).format('HH:mm'),
        sala: initialData.sala,
      });
    }
  }, [initialData, token]);

  useEffect(() => {
    const fetchDepartments = async () => {
      if (selectedFaculty) {
        try {
          const response = await axios.get(`http://localhost:8080/departments/${selectedFaculty}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDepartments(response.data);
        } catch (error) {
          console.error('Failed to fetch departments:', error);
        }
      } else {
        setDepartments([]);
      }
    };
    fetchDepartments();
  }, [selectedFaculty, token]);

  useEffect(() => {
    const fetchTeachers = async () => {
      if (selectedFaculty && selectedDepartment) {
        try {
          const response = await axios.get(
            `http://localhost:8080/teachers/${selectedFaculty}/${selectedDepartment}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setTeachers(response.data);
        } catch (error) {
          console.error('Failed to fetch teachers:', error);
        }
      } else {
        setTeachers([]);
      }
    };
    fetchTeachers();
  }, [selectedFaculty, selectedDepartment, token]);

  useEffect(() => {
    const fetchTeacherCourses = async () => {
      if (selectedTeacher) {
        try {
          const response = await axios.get(
            `http://localhost:8080/teacher-courses/${selectedTeacher}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setTeacherCourses(response.data);
        } catch (error) {
          console.error('Failed to fetch teacher courses:', error);
        }
      } else {
        setTeacherCourses([]);
      }
    };
    fetchTeacherCourses();
  }, [selectedTeacher, token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFacultyChange = (e) => {
    setSelectedFaculty(e.target.value);
    setSelectedDepartment('');
    setSelectedTeacher('');
    setSelectedCourse('');
    setFormData({ ...formData, group: '', asistent: '', data: '', ora: '', sala: '' });
  };

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setSelectedTeacher('');
    setSelectedCourse('');
    setFormData({ ...formData, group: '', asistent: '', data: '', ora: '', sala: '' });
  };

  const handleTeacherChange = (e) => {
    setSelectedTeacher(e.target.value);
    setSelectedCourse('');
    setFormData({ ...formData, group: '', asistent: '', data: '', ora: '', sala: '' });
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setFormData({ ...formData, discipline: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get the selected group details
      const selectedGroupDetails = groups.find(g => g.group_nr === formData.group);
      const groupDisplay = `${selectedGroupDetails.specialization} | ${selectedGroupDetails.universitary_year} | ${selectedGroupDetails.group_nr}`;

      // Get the selected teacher details
      const selectedTeacherDetails = teachers.find(t => t.id === selectedTeacher);
      const teacherDisplay = selectedTeacherDetails ? `${selectedTeacherDetails.lastName} ${selectedTeacherDetails.firstName}` : selectedTeacher;

      // Format the data for the backend
      const examData = {
        group: groupDisplay,
        discipline: selectedCourse,
        titular: teacherDisplay,
        asistent: formData.asistent || null,
        data: formData.data,
        ora: formData.ora,
        sala: formData.sala,
        student_id: user.id
      };

      console.log('Sending exam data to backend:', examData);

      const response = await axios.post('http://localhost:8080/exams_schedule/', examData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response from backend:', response.data);
      onSubmit(response.data);
    } catch (error) {
      console.error('Failed to create exam schedule:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
    }
  };

  const filteredGroups = groups;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        select
        label="Faculty"
        value={selectedFaculty}
        onChange={handleFacultyChange}
        fullWidth
      >
        {faculties.map(faculty => (
          <MenuItem key={faculty} value={faculty}>{faculty}</MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Department"
        value={selectedDepartment}
        onChange={handleDepartmentChange}
        fullWidth
        disabled={!selectedFaculty}
      >
        {departments.map(department => (
          <MenuItem key={department} value={department}>{department}</MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Teacher"
        value={selectedTeacher}
        onChange={handleTeacherChange}
        fullWidth
        disabled={!selectedDepartment}
      >
        {teachers.map(teacher => (
          <MenuItem key={teacher.id} value={teacher.id}>
            {`${teacher.lastName} ${teacher.firstName}`}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Course"
        value={selectedCourse}
        onChange={handleCourseChange}
        fullWidth
        disabled={!selectedTeacher}
      >
        {teacherCourses.map(course => (
          <MenuItem key={course.name} value={course.name}>
            {`${course.name} `}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Group"
        name="group"
        value={formData.group}
        onChange={handleChange}
        fullWidth
      >
        {filteredGroups.map(group => (
          <MenuItem key={group.id} value={group.group_nr}>
            {`${group.group_nr} | ${group.specialization} | ${group.universitary_year}`}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Asistent (optional)"
        name="asistent"
        value={formData.asistent}
        onChange={handleChange}
        fullWidth
      />

      <TextField
        label="Data"
        name="data"
        type="date"
        value={formData.data}
        onChange={handleChange}
        fullWidth
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        select
        label="Ora"
        name="ora"
        value={formData.ora}
        onChange={handleChange}
        fullWidth
      >
        {timeOptions.map((time) => (
          <MenuItem key={time} value={time}>
            {time}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Sala"
        name="sala"
        value={formData.sala}
        onChange={handleChange}
        fullWidth
      >
        {classrooms.map(classroom => (
          <MenuItem key={classroom.id} value={classroom.name}>
            {classroom.name}
          </MenuItem>
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