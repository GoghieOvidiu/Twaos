import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, Typography, Dialog, DialogContent, DialogTitle } from '@mui/material';
import axios from 'axios';
import ExamForm from './ExamForm';
import useAuthStore from '../store/authStore';

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const { token, user } = useAuthStore();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get('http://localhost:8080/exams_schedule/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const examEvents = response.data.map(exam => ({
          id: exam.id,
          title: `Exam: ${exam.course_id} (Group: ${exam.group_id})`,
          start: exam.date,
          extendedProps: { ...exam },
        }));
        setEvents(examEvents);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      }
    };
    fetchExams();
  }, [token]);

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setEditEvent(null);
    setOpen(true);
  };

  const handleEventClick = (arg) => {
    if (arg.event.extendedProps.user_id === user.id) {
      setEditEvent(arg.event.extendedProps);
      setOpen(true);
    } else {
      alert('You can only edit your own exams.');
    }
  };

  const handleEventSubmit = async (examData) => {
    try {
      if (editEvent) {
        // Update existing exam
        await axios.put(`http://localhost:8080/exams_schedule/${editEvent.id}`, examData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create new exam
        await axios.post('http://localhost:8080/exams_schedule/', examData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      // Refresh events
      const response = await axios.get('http://localhost:8080/exams_schedule/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(response.data.map(exam => ({
        id: exam.id,
        title: `Exam: ${exam.course_id} (Group: ${exam.group_id})`,
        start: exam.date,
        extendedProps: { ...exam },
      })));
      setOpen(false);
    } catch (error) {
      console.error('Failed to save exam:', error);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
      />
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editEvent ? 'Edit Exam' : 'Add Exam'}</DialogTitle>
        <DialogContent>
          <ExamForm
            initialDate={selectedDate}
            initialData={editEvent}
            onSubmit={handleEventSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Dashboard;