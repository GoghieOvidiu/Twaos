import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Dialog, 
  DialogContent, 
  DialogTitle,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Stack,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  Event as EventIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  CalendarMonth as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import axios from 'axios';
import ExamForm from './ExamForm';
import useAuthStore from '../store/authStore';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { token, user, logout, isAuthenticated } = useAuthStore();
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get('http://localhost:8080/exams_schedule/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const examEvents = response.data.map(exam => ({
          id: exam.id,
          title: String(exam.course_id || ''),
          group: String(exam.group_id || ''),
          date: exam.date,
          user_id: exam.user_id,
          ...exam
        }));
        setEvents(examEvents);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      }
    };
    fetchExams();
  }, [token]);

  const handleAddExam = () => {
    setSelectedDate(null);
    setEditEvent(null);
    setOpen(true);
  };

  const handleEditExam = (exam) => {
    if (exam.user_id === user.id) {
      setEditEvent(exam);
      setOpen(true);
    } else {
      alert('You can only edit your own exams.');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await axios.delete(`http://localhost:8080/exams_schedule/${examId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvents(events.filter(event => event.id !== examId));
      } catch (error) {
        console.error('Failed to delete exam:', error);
      }
    }
  };

  const handleEventSubmit = async (examData) => {
    try {
      setEvents(prevEvents => {
        if (editEvent) {
          return prevEvents.map(event => 
            event.id === editEvent.id ? { ...examData, id: editEvent.id } : event
          );
        } else {
          return [...prevEvents, examData];
        }
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to save exam:', error);
    }
  };

  const stats = {
    totalExams: events.length,
    upcomingExams: events.filter(event => new Date(event.date) > new Date()).length,
    myExams: events.filter(event => event.user_id === user.id).length,
  };

  const filteredExams = events.filter(exam => {
    const matchesSearch = String(exam.title).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(exam.group).includes(searchTerm);
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'upcoming' && new Date(exam.date) > new Date()) ||
                         (filterStatus === 'my' && exam.user_id === user.id);
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (date) => {
    const examDate = new Date(date);
    const now = new Date();
    if (examDate < now) return 'error';
    if (examDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) return 'warning';
    return 'success';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ 
      p: 3,
      backgroundColor: alpha(theme.palette.background.default, 0.8),
      minHeight: '100vh'
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <CalendarIcon fontSize="large" />
          Exam Schedule
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddExam}
          sx={{ borderRadius: 2 }}
        >
          Add New Exam
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EventIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Exams</Typography>
              </Box>
              <Typography variant="h4">{stats.totalExams}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SchoolIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Upcoming</Typography>
              </Box>
              <Typography variant="h4">{stats.upcomingExams}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            height: '100%',
            background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <GroupIcon sx={{ mr: 1 }} />
                <Typography variant="h6">My Exams</Typography>
              </Box>
              <Typography variant="h4">{stats.myExams}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1}>
            <Chip
              label="All"
              onClick={() => setFilterStatus('all')}
              color={filterStatus === 'all' ? 'primary' : 'default'}
            />
            <Chip
              label="Upcoming"
              onClick={() => setFilterStatus('upcoming')}
              color={filterStatus === 'upcoming' ? 'primary' : 'default'}
            />
            <Chip
              label="My Exams"
              onClick={() => setFilterStatus('my')}
              color={filterStatus === 'my' ? 'primary' : 'default'}
            />
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {filteredExams.map((exam) => (
            <Grid item xs={12} sm={6} md={4} key={exam.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {exam.title}
                    </Typography>
                    <Chip
                      label={moment(exam.date).format('MMM D, YYYY')}
                      color={getStatusColor(exam.date)}
                      size="small"
                    />
                  </Box>
                  
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GroupIcon fontSize="small" color="action" />
                      <Typography variant="body2">Group {exam.group}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {moment(exam.date).utc().format('HH:mm')}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                    {exam.user_id === user.id && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditExam(exam)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteExam(exam.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: 24
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          py: 2
        }}>
          {editEvent ? 'Edit Exam' : 'Add New Exam'}
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <ExamForm
            initialDate={selectedDate}
            initialData={editEvent}
            onSubmit={handleEventSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Button variant="contained" color="primary" onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  );
}

export default Dashboard;