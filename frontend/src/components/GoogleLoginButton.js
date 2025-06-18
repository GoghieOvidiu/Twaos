import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';
import { Alert } from '@mui/material';

const GoogleLoginButton = () => {
  const [error, setError] = useState('');
  const googleLogin = useAuthStore((state) => state.googleLogin);

  const handleGoogleLogin = async (credential) => {
    try {
      const success = await googleLogin(credential);
      if (!success) {
        setError('Failed to login with Google. Please try again.');
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('An error occurred during Google login. Please try again.');
    }
  };

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          setError('');
          handleGoogleLogin(credentialResponse.credential);
        }}
        onError={() => {
          setError('Google login failed. Please try again.');
          console.log('Login Failed');
        }}
        useOneTap
      />
    </>
  );
};

export default GoogleLoginButton; 