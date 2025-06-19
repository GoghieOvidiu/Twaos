import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, IconButton, TextField, Button, Tooltip, Alert, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import * as XLSX from 'xlsx';

function AdminCadrePanel() {
  const { token } = useAuthStore();
  const [cadre, setCadre] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState(null);
  const [secretaryForm, setSecretaryForm] = useState({ first_name: '', last_name: '', email: '' });
  const [secretaryMsg, setSecretaryMsg] = useState(null);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  useEffect(() => {
    const fetchCadre = async () => {
      try {
        const response = await axios.get('http://localhost:8080/cadre/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCadre(response.data);
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to fetch cadre list.' });
      }
    };
    fetchCadre();
  }, [token]);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await axios.get('http://localhost:8080/faculties/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFaculties(response.data);
      } catch {}
    };
    fetchFaculties();
  }, [token]);

  useEffect(() => {
    if (!selectedFaculty) {
      setDepartments([]);
      setSelectedDepartment('');
      return;
    }
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/departments/${encodeURIComponent(selectedFaculty)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDepartments(response.data);
      } catch {}
    };
    fetchDepartments();
  }, [selectedFaculty, token]);

  const handleEdit = (row) => {
    setEditId(row.id);
    setEditForm({
      lastName: row.lastName || '',
      firstName: row.firstName || '',
      emailAddress: row.emailAddress || '',
      phoneNumber: row.phoneNumber || '',
      facultyName: row.facultyName || '',
      departmentName: row.departmentName || ''
    });
  };

  const handleCancel = () => {
    setEditId(null);
    setEditForm({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    try {
      const response = await axios.put(`http://localhost:8080/cadre/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCadre(cadre.map(c => c.id === id ? response.data : c));
      setEditId(null);
      setEditForm({});
      setMessage({ type: 'success', text: 'Cadre updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update cadre.' });
    }
  };

  const handlePopulate = async () => {
    setMessage(null);
    try {
      const response = await axios.post('http://localhost:8080/cadre/populate/', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMessage({ type: 'success', text: `Cadre table repopulated. Added: ${response.data.added}` });
        // Refresh list
        const cadreResp = await axios.get('http://localhost:8080/cadre/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCadre(cadreResp.data);
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to repopulate cadre.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to repopulate cadre.' });
    }
  };

  const handleSecretaryChange = (e) => {
    const { name, value } = e.target;
    setSecretaryForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSecretary = async (e) => {
    e.preventDefault();
    setSecretaryMsg(null);
    try {
      const response = await axios.post('http://localhost:8080/users/secretary', secretaryForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSecretaryMsg({ type: 'success', text: 'Secretary added successfully.' });
      setSecretaryForm({ first_name: '', last_name: '', email: '' });
    } catch (err) {
      setSecretaryMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to add secretary.' });
    }
  };

  const handleBulkFile = async (e) => {
    setBulkResult(null);
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      let data = new Uint8Array(evt.target.result);
      let workbook = XLSX.read(data, { type: 'array' });
      let sheetName = workbook.SheetNames[0];
      let worksheet = workbook.Sheets[sheetName];
      let json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      // Remove empty rows
      json = json.filter(row => Array.isArray(row) && row.length >= 2 && row[0] && row[1]);
      // If first row looks like header, remove it
      if (json.length && (String(json[0][0]).toLowerCase().includes('name') || String(json[0][1]).toLowerCase().includes('email'))) {
        json = json.slice(1);
      }
      // Map to objects: split full name into first_name, last_name
      const secretariesArr = json.map(row => {
        const fullName = row[0].trim();
        const email = row[1].trim();
        const nameParts = fullName.split(' ');
        let first_name = '';
        let last_name = '';
        if (nameParts.length === 1) {
          first_name = nameParts[0];
          last_name = nameParts[0];
        } else {
          last_name = nameParts[nameParts.length - 1];
          first_name = nameParts.slice(0, -1).join(' ');
        }
        return { first_name, last_name, email };
      });
      setBulkPreview(secretariesArr);
      // Send to backend
      try {
        const response = await axios.post('http://localhost:8080/users/secretary/bulk', secretariesArr, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBulkResult(response.data);
      } catch (err) {
        setBulkResult({ error: 'Failed to upload secretaries.' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredCadre = selectedDepartment
    ? cadre.filter(c => c.departmentName === selectedDepartment)
    : cadre;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Admin Cadre Management</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Faculty</InputLabel>
          <Select
            value={selectedFaculty}
            label="Faculty"
            onChange={e => {
              setSelectedFaculty(e.target.value);
              setSelectedDepartment('');
            }}
          >
            <MenuItem value=""><em>All Faculties</em></MenuItem>
            {faculties.map(fac => (
              <MenuItem key={fac} value={fac}>{fac}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!selectedFaculty}>
          <InputLabel>Department</InputLabel>
          <Select
            value={selectedDepartment}
            label="Department"
            onChange={e => setSelectedDepartment(e.target.value)}
          >
            <MenuItem value=""><em>All Departments</em></MenuItem>
            {departments.map(dep => (
              <MenuItem key={dep} value={dep}>{dep}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={handlePopulate}>
        Repopulate Cadre Table
      </Button>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Add Secretary</Typography>
        <form onSubmit={handleAddSecretary} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TextField label="First Name" name="first_name" value={secretaryForm.first_name} onChange={handleSecretaryChange} size="small" required />
          <TextField label="Last Name" name="last_name" value={secretaryForm.last_name} onChange={handleSecretaryChange} size="small" required />
          <TextField label="Email" name="email" value={secretaryForm.email} onChange={handleSecretaryChange} size="small" required type="email" />
          <Button type="submit" variant="contained">Add</Button>
        </form>
        {secretaryMsg && <Alert severity={secretaryMsg.type} sx={{ mt: 1 }}>{secretaryMsg.text}</Alert>}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Bulk Add Secretaries (XLSX/CSV, no header, format: Nume Prenume, email)</Typography>
          <Button variant="outlined" component="label" sx={{ mt: 1 }}>
            Upload File
            <input type="file" accept=".xlsx,.csv" hidden onChange={handleBulkFile} />
          </Button>
          {bulkResult && (
            <Box sx={{ mt: 1 }}>
              {bulkResult.error ? (
                <Alert severity="error">{bulkResult.error}</Alert>
              ) : (
                <Alert severity="success">
                  Created: {bulkResult.created?.length || 0}, Skipped: {bulkResult.skipped?.length || 0}
                </Alert>
              )}
            </Box>
          )}
          {bulkPreview.length > 0 && (
            <Table size="small" sx={{ mt: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bulkPreview.map((s, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{s.first_name}</TableCell>
                    <TableCell>{s.last_name}</TableCell>
                    <TableCell>{s.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Box>
      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
      )}
      {selectedFaculty && selectedDepartment ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Last Name</TableCell>
              <TableCell>First Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Faculty</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCadre.map(row => (
              <TableRow key={row.id}>
                <TableCell>
                  {editId === row.id ? (
                    <TextField name="lastName" value={editForm.lastName} onChange={handleChange} size="small" />
                  ) : row.lastName}
                </TableCell>
                <TableCell>
                  {editId === row.id ? (
                    <TextField name="firstName" value={editForm.firstName} onChange={handleChange} size="small" />
                  ) : row.firstName}
                </TableCell>
                <TableCell>
                  {editId === row.id ? (
                    <TextField name="emailAddress" value={editForm.emailAddress} onChange={handleChange} size="small" />
                  ) : row.emailAddress}
                </TableCell>
                <TableCell>
                  {editId === row.id ? (
                    <TextField name="phoneNumber" value={editForm.phoneNumber} onChange={handleChange} size="small" />
                  ) : row.phoneNumber}
                </TableCell>
                <TableCell>
                  {editId === row.id ? (
                    <TextField name="facultyName" value={editForm.facultyName} onChange={handleChange} size="small" />
                  ) : row.facultyName}
                </TableCell>
                <TableCell>
                  {editId === row.id ? (
                    <TextField name="departmentName" value={editForm.departmentName} onChange={handleChange} size="small" />
                  ) : row.departmentName}
                </TableCell>
                <TableCell>
                  {editId === row.id ? (
                    <>
                      <Tooltip title="Save"><IconButton onClick={() => handleSave(row.id)}><SaveIcon /></IconButton></Tooltip>
                      <Tooltip title="Cancel"><IconButton onClick={handleCancel}><CancelIcon /></IconButton></Tooltip>
                    </>
                  ) : (
                    <Tooltip title="Edit"><IconButton onClick={() => handleEdit(row)}><EditIcon /></IconButton></Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>Please select both faculty and department to view and edit cadre.</Alert>
      )}
    </Box>
  );
}

export default AdminCadrePanel; 