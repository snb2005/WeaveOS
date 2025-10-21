import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/apiClient';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name?: string;
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  confirmPassword?: string;
}

interface ProfileData {
  name?: string;
  email?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

// Extended API response interfaces
interface UserApiResponse {
  success: boolean;
  user?: User;
  data?: User;
  storage?: any;
  message?: string;
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<any>;
  register: (userData: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateProfile: (profileData: ProfileData) => Promise<any>;
  changePassword: (passwordData: PasswordData) => Promise<any>;
  clearError: () => void;
  initialize: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
}

const useAuthStore = create<AuthState>()(
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
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage
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
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage
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

      refreshUser: async (): Promise<User | null> => {
        if (!get().isAuthenticated) return null;
        
        set({ isLoading: true });
        
        try {
          const response = await apiClient.getCurrentUser() as UserApiResponse;
          const user = response.user || response.data;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          return user ?? null;
        } catch (error) {
          console.error('Refresh user error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh user';
          
          // If token is invalid, logout
          if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
            get().logout();
          } else {
            set({
              isLoading: false,
              error: errorMessage
            });
          }
          
          throw error;
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.updateUserProfile(profileData) as UserApiResponse;
          const updatedUser = response.user || response.data;
          const currentUser = get().user;
          
          set({
            user: currentUser && updatedUser ? { ...currentUser, ...updatedUser } : updatedUser || currentUser,
            isLoading: false,
            error: null
          });
          
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
          set({
            isLoading: false,
            error: errorMessage
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
          const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
          set({
            isLoading: false,
            error: errorMessage
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
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth initialization timeout')), 10000)
          );
          
          await Promise.race([
            get().refreshUser(),
            timeoutPromise
          ]);
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Clear token if auth check fails
          localStorage.removeItem('authToken');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      // Check if user has specific permission
      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;
        
        // Admin has all permissions
        if (user.role === 'admin') return true;
        
        // Add more permission logic here as needed
        // For now, we'll implement basic role-based permissions
        switch (permission) {
          case 'admin':
            return user.role === 'admin';
          case 'write':
            return ['admin', 'editor', 'user'].includes(user.role);
          case 'read':
            return ['admin', 'editor', 'user', 'viewer'].includes(user.role);
          default:
            return false;
        }
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
