import { create } from 'zustand';

interface AppState {
  // Add your state properties here
}

export const useUserStore = create<AppState>(() => ({
  // Initialize your state here
}));
