/**
 * API Client for Weave OS Backend
 * Handles all HTTP requests to the backend server
 */

// Environment-based API configuration
const getAPIBaseURL = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback to environment detection
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  // Production mode - use Render backend
  return 'https://weaveos.onrender.com/api';
};

const API_BASE_URL = getAPIBaseURL();

// Log the configuration for debugging
console.log('🔧 API Configuration:', {
  baseURL: API_BASE_URL,
  environment: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  hostname: window.location.hostname
});

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Helper method to get headers
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Helper method to handle responses
  async handleResponse(response) {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If response is not JSON, throw generic error
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
      console.error('❌ API Error:', {
        status: response.status,
        message: errorMessage,
        url: response.url
      });
      throw new Error(errorMessage);
    }
    
    return data;
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Authentication methods
  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(userData),
      credentials: 'include'
    });
    
    const data = await this.handleResponse(response);
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async login(credentials) {
    console.log('🔐 Attempting login with:', { email: credentials.email, passwordLength: credentials.password.length });
    console.log('🌐 API_BASE_URL:', API_BASE_URL);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(credentials),
        credentials: 'include'
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', [...response.headers.entries()]);
      
      const data = await this.handleResponse(response);
      
      if (data.token) {
        this.setToken(data.token);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Login fetch error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async logout() {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    this.setToken(null);
    return this.handleResponse(response);
  }

  async getCurrentUser() {
    console.log('👤 Fetching current user from:', `${API_BASE_URL}/auth/me`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getHeaders(),
        credentials: 'include'
      });
      
      console.log('👤 Get user response status:', response.status);
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('❌ Get current user error:', error);
      throw error;
    }
  }

  async changePassword(passwordData) {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(passwordData),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  // User management methods
  async getUserProfile() {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async updateUserProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async getUserStorage() {
    const response = await fetch(`${API_BASE_URL}/users/storage`, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async searchUsers(query, limit = 10) {
    const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  // File management methods
  async getFiles(path = '/') {
    const url = `${API_BASE_URL}/files?path=${encodeURIComponent(path)}`;
      
    const response = await fetch(url, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async uploadFile(file, path = '/') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async downloadFile(fileId) {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/download`, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    
    return response.blob();
  }

  async getFileContent(fileId) {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/content`, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async updateFileContent(fileId, content) {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/content`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ content }),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async createFolder(name, path = '/') {
    const response = await fetch(`${API_BASE_URL}/files/folder`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, path }),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async deleteFile(fileId) {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async renameFile(fileId, newName) {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ filename: newName }),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async moveFile(fileId, newParentId) {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}/move`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ newParent: newParentId }),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  // File sharing methods
  async shareFile(fileId, userId, permissions) {
    const response = await fetch(`${API_BASE_URL}/sharing/${fileId}/share`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ userId, permissions }),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async revokeFileSharing(fileId, userId) {
    const response = await fetch(`${API_BASE_URL}/sharing/${fileId}/share/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async getSharedWithMe() {
    const response = await fetch(`${API_BASE_URL}/sharing/shared-with-me`, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async getSharedByMe() {
    const response = await fetch(`${API_BASE_URL}/sharing/shared-by-me`, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  // Admin methods
  async getAllUsers(page = 1, limit = 20, search = '', status = '') {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const response = await fetch(`${API_BASE_URL}/users/admin/all?${params}`, {
      headers: this.getHeaders(),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async updateUserStatus(userId, isActive) {
    const response = await fetch(`${API_BASE_URL}/users/admin/${userId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ isActive }),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  async updateUserQuota(userId, storageQuota) {
    const response = await fetch(`${API_BASE_URL}/users/admin/${userId}/quota`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ storageQuota }),
      credentials: 'include'
    });
    
    return this.handleResponse(response);
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return this.handleResponse(response);
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;
