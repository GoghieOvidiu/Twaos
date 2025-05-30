import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { Container } from "@mui/material";
import Navbar from "./components/Navbar"; // Import the Navbar component
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ExamRequests from "./components/ExamRequests";
import Profile from "./components/Profile";
import useAuthStore from "./store/authStore";
import Register from './components/Register'; // Import the Register component

import "./App.css";

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" />;
  //return children;
}

function App() {
  const { loadToken } = useAuthStore();

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  return (
    <Router>
      <Navbar /> {/* Add the Navbar here */}
      <Container>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* Add the Register route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam-requests"
            element={
              <ProtectedRoute>
                <ExamRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
