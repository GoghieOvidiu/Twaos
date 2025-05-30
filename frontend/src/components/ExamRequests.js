import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, Button } from '@mui/material';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, coursesRes] = await Promise.all([
          axios.get('http://localhost:8080/exams_schedule/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8080/courses/', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setExams(examsRes.data);
        setCourses(coursesRes.data);
        // Set default filter for teachers
        if (user?.type === 'TEACHER') {
          const teacherCourse = coursesRes.data.find(course => course.owner_user_id === user.id);
          setSelectedCourse(teacherCourse?.id || '');
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, [token, user]);

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(userExams.map(exam => ({
      CourseID: exam.course_id,
      GroupID: exam.group_id,
      Date: moment(exam.date).format('YYYY-MM-DD HH:mm'),
      Status: exam.status,
      UserID: exam.user_id,
      ClassroomID: exam.classroom_id,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ExamRequests');
    XLSX.writeFile(workbook, 'ExamRequests.xlsx');
  };

  // Export to PDF
  const exportToPDF = () => {
  const doc = new jsPDF();
  doc.text('Exam Requests', 14, 10); // Add a title to the PDF
  doc.autoTable({
    head: [['Course ID', 'Group ID', 'Date', 'Status', 'User ID', 'Classroom ID']], // Table headers
    body: userExams.map(exam => [
      exam.course_id,
      exam.group_id,
      moment(exam.date).format('YYYY-MM-DD HH:mm'),
      exam.status,
      exam.user_id,
      exam.classroom_id,
    ]), // Table rows
  });
  doc.save('ExamRequests.pdf'); // Save the PDF
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
    ? exams.filter(exam => exam.course_id === parseInt(selectedCourse))
    : exams;

  const isStudent = user?.type === 'STUDENT';
  const userExams = isStudent ? filteredExams.filter(exam => exam.user_id === user.id) : filteredExams;

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
        <Button variant="contained" color="primary" onClick={exportToExcel} sx={{ mr: 2 }}>
          Export to Excel
        </Button>
        <Button variant="contained" color="secondary" onClick={exportToPDF}>
          Export to PDF
        </Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Course ID</TableCell>
            <TableCell>Group ID</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>User ID</TableCell>
            <TableCell>Classroom ID</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {userExams.map(exam => (
            <TableRow key={exam.id}>
              <TableCell>{exam.course_id}</TableCell>
              <TableCell>{exam.group_id}</TableCell>
              <TableCell>{moment(exam.date).format('YYYY-MM-DD HH:mm')}</TableCell>
              <TableCell>{exam.status}
              </TableCell>
              <TableCell>{exam.user_id}</TableCell>
              <TableCell>{exam.classroom_id}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

export default ExamRequests;