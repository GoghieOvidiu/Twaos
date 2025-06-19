import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function RoleProtectedRoute({ allowedTypes, children }) {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated());

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedTypes.includes(user.type?.toUpperCase())) {
    return <Navigate to="/exam-requests" replace />;
  }

  return children;
}

export default RoleProtectedRoute; 