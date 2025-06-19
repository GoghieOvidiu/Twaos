import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

function Navbar() {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuthStore();
  const user = useAuthStore(state => state.user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Exam Scheduler
        </Typography>
        {isAuthenticated() && (
          <>
            {/* <Button color="inherit" component={Link} to="/dashboard">
              Dashboard
            </Button> */}
            <Button color="inherit" component={Link} to="/exam-requests">
              Programarea examenelor
            </Button>
            {(user?.type?.toUpperCase() === 'ADMIN' || user?.type?.toUpperCase() === 'SECRETARY') && (
              <Button color="inherit" component={Link} to="/secretariat">
                Secretariat Panel
              </Button>
            )}
            {user?.type?.toUpperCase() === 'ADMIN' && (
              <Button color="inherit" component={Link} to="/admin-cadre">
                Admin Panel
              </Button>
            )}
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        )}
        {!isAuthenticated() && (
          <>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            {/* <Button color="inherit" component={Link} to="/register">
              Register
            </Button> */}
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;