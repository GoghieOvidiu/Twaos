import {create} from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
  token: localStorage.getItem("token") || null,
  user: null,
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
      //set({ user });
      localStorage.setItem('token', access_token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      set({ token: null, user: null });
      localStorage.removeItem('token');
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
  loadToken: () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token });
      // Fetch user data
      axios.get('http://localhost:8080/users/', {
        headers: { Authorization: `Bearer ${token}` },
      }).then(response => {
        set({ user: response.data[0] }); // Simplified; adjust based on token payload
      }).catch(error => {
        console.error('Failed to load user:', error);
        set({ token: null });
        localStorage.removeItem('token');
      });
    }
  },
}));

export default useAuthStore;