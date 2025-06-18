import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  MenuItem, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import moment from 'moment';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ExamRequests() {
  const { token, user } = useAuthStore();
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [editFormData, setEditFormData] = useState({
    group: '',
    discipline: '',
    titular: '',
    asistent: '',
    data: '',
    ora: '',
    sala: ''
  });
  const [createFormData, setCreateFormData] = useState({
    group: '',
    discipline: '',
    titular: '',
    asistent: '',
    data: '',
    ora: '',
    sala: ''
  });

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get('http://localhost:8080/exams_schedule/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // If user is a student, filter exams to show only those created by them
        if (user?.type === 'STUDENT') {
          const studentExams = response.data.filter(exam => exam.student_id === user.id);
          setExams(studentExams);
        } else {
          setExams(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      }
    };

    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:8080/courses/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(response.data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    };

    fetchExams();
    fetchCourses();
  }, [token, user]);

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(exams.map(exam => ({
      Group: exam.group,
      Discipline: exam.discipline,
      Titular: exam.titular,
      Asistent: exam.asistent || 'N/A',
      Data: moment(exam.data).format('YYYY-MM-DD'),
      Ora: exam.ora,
      Sala: exam.sala
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ExamRequests');
    XLSX.writeFile(workbook, 'ExamRequests.xlsx');
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Exam Requests', 14, 10);
    doc.autoTable({
      head: [['Group', 'Discipline', 'Titular', 'Asistent', 'Data', 'Ora', 'Sala']],
      body: exams.map(exam => [
        exam.group,
        exam.discipline,
        exam.titular,
        exam.asistent || 'N/A',
        moment(exam.data).format('YYYY-MM-DD'),
        exam.ora,
        exam.sala
      ]),
    });
    doc.save('ExamRequests.pdf');
  };

  // const handleStatusChange = async (examId, newStatus) => {
  //   try {
  //     // Update the status in the backend
  //     await axios.put(
  //       `http://localhost:8080/exams_schedule/${examId}`,
  //       { status: newStatus },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     // Update the status in the local state
  //     setExams((prevExams) =>
  //       prevExams.map((exam) =>
  //         exam.id === examId ? { ...exam, status: newStatus } : exam
  //       )
  //     );
  //   } catch (error) {
  //     console.error('Failed to update status:', error);
  //   }
  // };

  const filteredExams = selectedCourse
    ? exams.filter(exam => exam.course_id === selectedCourse)
    : exams;

  const isStudent = user?.type === 'STUDENT';
  // Remove the userExams filter since we're already filtering in fetchExams
  const userExams = filteredExams;

  // Check if user is teacher or secretary
  const canEdit = user?.type === 'TEACHER' || user?.role === 'SECRETARY';

  const handleEditClick = (exam) => {
    if (!canEdit) {
      return; // Prevent editing if user is not authorized
    }
    setEditingExam(exam);
    setEditFormData({
      group: exam.group,
      discipline: exam.discipline,
      titular: exam.titular,
      asistent: exam.asistent || '',
      data: moment(exam.data).format('YYYY-MM-DD'),
      ora: exam.ora,
      sala: exam.sala
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!canEdit) {
      return; // Prevent submission if user is not authorized
    }
    try {
      await axios.put(`http://localhost:8080/exams_schedule/${editingExam.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the exams list with the edited exam
      setExams(exams.map(exam => 
        exam.id === editingExam.id ? { ...exam, ...editFormData } : exam
      ));
      
      setEditDialogOpen(false);
      setEditingExam(null);
    } catch (error) {
      console.error('Failed to update exam:', error);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateClick = () => {
    setCreateFormData({
      group: '',
      discipline: '',
      titular: '',
      asistent: '',
      data: '',
      ora: '',
      sala: ''
    });
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const response = await axios.post('http://localhost:8080/exams_schedule/', createFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setExams([...exams, response.data]);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create exam:', error);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Exam Requests</Typography>
      {!isStudent && (
        <TextField
          select
          label="Filter by Course"
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          sx={{ mb: 2, minWidth: 200 }}
        >
          <MenuItem value="">All Courses</MenuItem>
          {courses.map(course => (
            <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>
          ))}
        </TextField>
      )}
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" color="primary" onClick={handleCreateClick} sx={{ mr: 2 }}>
          Create New Exam
        </Button>
        <Button variant="contained" color="primary" onClick={exportToExcel} sx={{ mr: 2 }}>
          Export to Excel
        </Button>
        <Button variant="contained" color="primary" onClick={exportToPDF}>
          Export to PDF
        </Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Group</TableCell>
            <TableCell>Discipline</TableCell>
            <TableCell>Titular</TableCell>
            <TableCell>Asistent</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Ora</TableCell>
            <TableCell>Sala</TableCell>
            {canEdit && <TableCell>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {userExams.map(exam => (
            <TableRow key={exam.id}>
              <TableCell>{exam.group}</TableCell>
              <TableCell>{exam.discipline}</TableCell>
              <TableCell>{exam.titular}</TableCell>
              <TableCell>{exam.asistent || 'N/A'}</TableCell>
              <TableCell>{moment(exam.data).format('YYYY-MM-DD')}</TableCell>
              <TableCell>{exam.ora}</TableCell>
              <TableCell>{exam.sala}</TableCell>
              {canEdit && (
                <TableCell>
                  <Tooltip title="Edit Exam">
                    <IconButton onClick={() => handleEditClick(exam)} color="primary">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create Exam Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Exam</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              name="group"
              label="Group"
              value={createFormData.group}
              onChange={handleCreateChange}
              fullWidth
            />
            <TextField
              name="discipline"
              label="Discipline"
              value={createFormData.discipline}
              onChange={handleCreateChange}
              fullWidth
            />
            <TextField
              name="titular"
              label="Titular"
              value={createFormData.titular}
              onChange={handleCreateChange}
              fullWidth
            />
            <TextField
              name="asistent"
              label="Asistent"
              value={createFormData.asistent}
              onChange={handleCreateChange}
              fullWidth
            />
            <TextField
              name="data"
              label="Data"
              type="date"
              value={createFormData.data}
              onChange={handleCreateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              name="ora"
              label="Ora"
              type="time"
              value={createFormData.ora}
              onChange={handleCreateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              name="sala"
              label="Sala"
              value={createFormData.sala}
              onChange={handleCreateChange}
              fullWidth
            />
            <Button variant="contained" onClick={handleCreateSubmit}>
              Create
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Exam</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Group"
              name="group"
              value={editFormData.group}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              label="Discipline"
              name="discipline"
              value={editFormData.discipline}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              label="Titular"
              name="titular"
              value={editFormData.titular}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              label="Asistent"
              name="asistent"
              value={editFormData.asistent}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              label="Data"
              name="data"
              type="date"
              value={editFormData.data}
              onChange={handleEditChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Ora"
              name="ora"
              value={editFormData.ora}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              label="Sala"
              name="sala"
              value={editFormData.sala}
              onChange={handleEditChange}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setEditDialogOpen(false)} variant="outlined">
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} variant="contained" color="primary">
                Save Changes
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default ExamRequests;