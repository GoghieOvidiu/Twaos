import {create} from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
  token: localStorage.getItem("token") || null,
  user: JSON.parse(localStorage.getItem("user")) || null,
  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    return !!(token && user);
  },
  login: async (email, access_token) => {
    try {
      set({ token: access_token });
      // Fetch user data
      const userResponse = await axios.get('http://localhost:8080/users/', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const user = userResponse.data.find(u => u.email === email);
      if (!user) {
        throw new Error('User not found');
      }
      set({ user });
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      set({ token: null, user: null });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    }
  },
  googleLogin: async (credential) => {
    try {
      console.log('Starting Google login with credential:', credential.substring(0, 20) + '...');
      
      const response = await axios.post('http://localhost:8080/auth/google', {
        token: credential
      });
      
      console.log('Google auth response:', response.data);
      
      if (response.data.access_token) {
        const decodedToken = JSON.parse(atob(credential.split('.')[1]));
        console.log('Decoded token:', decodedToken);
        const email = decodedToken.email;
        console.log('User email:', email);
        return await useAuthStore.getState().login(email, response.data.access_token);
      }
      return false;
    } catch (error) {
      console.error('Google login failed:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      return false;
    }
  },
  logout: () => {
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
  loadToken: () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (token && user) {
      set({ token, user });
    } else {
      set({ token: null, user: null });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
}));

export default useAuthStore;