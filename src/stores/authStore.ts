import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.login(credentials);
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return response;
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message
          });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.register(userData);
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return response;
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await apiClient.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      refreshUser: async () => {
        if (!get().isAuthenticated) return;
        
        set({ isLoading: true });
        
        try {
          const response = await apiClient.getCurrentUser();
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return response.user;
        } catch (error) {
          console.error('Refresh user error:', error);
          
          // If token is invalid, logout
          if (error.message.includes('401') || error.message.includes('unauthorized')) {
            get().logout();
          } else {
            set({
              isLoading: false,
              error: error.message
            });
          }
          
          throw error;
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.updateUserProfile(profileData);
          
          set({
            user: { ...get().user, ...response.user },
            isLoading: false,
            error: null
          });
          
          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message
          });
          throw error;
        }
      },

      changePassword: async (passwordData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.changePassword(passwordData);
          
          set({
            isLoading: false,
            error: null
          });
          
          return response;
        } catch (error) {
          set({
            isLoading: false,
            error: error.message
          });
          throw error;
        }
      },

      // Clear any errors
      clearError: () => set({ error: null }),

      // Initialize auth state (check if user is already logged in)
      initialize: async () => {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }
        
        set({ isLoading: true });
        
        try {
          await get().refreshUser();
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      // Check if user has specific permission
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        
        // Admin has all permissions
        if (user.role === 'admin') return true;
        
        // Add more permission logic here as needed
        return true;
      },

      // Check if user is admin
      isAdmin: () => {
        const user = get().user;
        return user?.role === 'admin';
      }
    }),
    {
      name: 'weave-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
