import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent, TextField, IconButton, Tooltip, Alert } from '@mui/material';
import { Edit as EditIcon, UploadFile as UploadFileIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import moment from 'moment';

function SecretariatPanel() {
  const { token } = useAuthStore();
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get('http://localhost:8080/exams_schedule/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExams(response.data);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      }
    };
    fetchExams();
  }, [token]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      let json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      // Remove empty rows
      json = json.filter(row => Array.isArray(row) && row.length >= 2 && row[0] && row[1]);
      // If first row looks like header, remove it
      if (json.length && (String(json[0][0]).toLowerCase().includes('name') || String(json[0][1]).toLowerCase().includes('email'))) {
        json = json.slice(1);
      }
      // Map to objects: split full name into first_name, last_name
      const studentsArr = json.map(row => {
        const fullName = row[0].trim();
        const email = row[1].trim();
        const nameParts = fullName.split(' ');
        const first_name = nameParts.slice(1).join(' ') || nameParts[0];
        const last_name = nameParts[0];
        return { first_name, last_name, email };
      });
      setStudents(studentsArr);
      // Send to backend
      try {
        const response = await axios.post('http://localhost:8080/users/bulk_upload/', studentsArr, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUploadResult(response.data);
      } catch (err) {
        setUploadResult({ error: 'Failed to upload students.' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEditClick = (exam) => {
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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(`http://localhost:8080/exams_schedule/${editingExam.id}`, { ...editFormData, student_id: editingExam.student_id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(exams.map(exam => exam.id === editingExam.id ? { ...exam, ...editFormData } : exam));
      setEditDialogOpen(false);
      setEditingExam(null);
    } catch (error) {
      console.error('Failed to update exam:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Secretariat / Admin Panel</Typography>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Upload Student List (XLSX/CSV)</Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={<UploadFileIcon />}
          sx={{ mt: 2 }}
        >
          Upload File
          <input type="file" accept=".xlsx,.csv" hidden onChange={handleFileUpload} />
        </Button>
        {uploadResult && (
          <Box sx={{ mt: 2 }}>
            {uploadResult.error ? (
              <Alert severity="error">{uploadResult.error}</Alert>
            ) : (
              <Alert severity="success">
                Created: {uploadResult.created?.length || 0}, Skipped: {uploadResult.skipped?.length || 0}
              </Alert>
            )}
          </Box>
        )}
        {students.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Preview:</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{student.first_name}</TableCell>
                    <TableCell>{student.last_name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
      <Box>
        <Typography variant="h6" gutterBottom>Modify Exams</Typography>
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exams.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell>{exam.group}</TableCell>
                <TableCell>{exam.discipline}</TableCell>
                <TableCell>{exam.titular}</TableCell>
                <TableCell>{exam.asistent}</TableCell>
                <TableCell>{moment(exam.data).format('YYYY-MM-DD')}</TableCell>
                <TableCell>{exam.ora}</TableCell>
                <TableCell>{exam.sala}</TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleEditClick(exam)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Exam</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Group" name="group" value={editFormData.group} onChange={handleEditChange} />
            <TextField label="Discipline" name="discipline" value={editFormData.discipline} onChange={handleEditChange} />
            <TextField label="Titular" name="titular" value={editFormData.titular} onChange={handleEditChange} />
            <TextField label="Asistent" name="asistent" value={editFormData.asistent} onChange={handleEditChange} />
            <TextField label="Data" name="data" type="date" value={editFormData.data} onChange={handleEditChange} InputLabelProps={{ shrink: true }} />
            <TextField label="Ora" name="ora" value={editFormData.ora} onChange={handleEditChange} />
            <TextField label="Sala" name="sala" value={editFormData.sala} onChange={handleEditChange} />
            <Button variant="contained" onClick={handleEditSubmit}>Save</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default SecretariatPanel; 