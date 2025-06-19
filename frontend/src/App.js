import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Container } from "@mui/material";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from "./components/Navbar"; // Import the Navbar component
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ExamRequests from "./components/ExamRequests";
import Profile from "./components/Profile";
import useAuthStore from "./store/authStore";
import Register from './components/Register'; // Import the Register component
import ProtectedRoute from './components/ProtectedRoute';
import SecretariatPanel from './components/SecretariatPanel';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import AdminCadrePanel from './components/AdminCadrePanel';

import "./App.css";

function App() {
  const { loadToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  return (
    <GoogleOAuthProvider clientId="444468629856-hogjqe3aeggukmurso0lfhfpom0p11ks.apps.googleusercontent.com">
      <Router>
        <Navbar /> {/* Add the Navbar here */}
        <Container>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={!isAuthenticated() ? <Login /> : <Navigate to="/exam-requests" replace />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/exam-requests" element={
              <ProtectedRoute>
                <ExamRequests />
              </ProtectedRoute>
            } />
            <Route path="/secretariat" element={
              <RoleProtectedRoute allowedTypes={['ADMIN', 'SECRETARY']}>
                <SecretariatPanel />
              </RoleProtectedRoute>
            } />
            <Route path="/admin-cadre" element={
              <RoleProtectedRoute allowedTypes={['ADMIN']}>
                <AdminCadrePanel />
              </RoleProtectedRoute>
            } />
            
            {/* Redirect root to dashboard if authenticated, otherwise to login */}
            <Route path="/" element={<Navigate to={isAuthenticated() ? "/exam-requests" : "/login"}  />} />
          </Routes>
        </Container>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
