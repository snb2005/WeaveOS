/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Environment-based API configuration
export const getAPIBaseURL = () => {
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

export const getHealthURL = () => {
  const apiURL = getAPIBaseURL();
  return apiURL.replace('/api', '/health');
};

export const API_BASE_URL = getAPIBaseURL();
export const HEALTH_URL = getHealthURL();

// Log the configuration for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:', {
    baseURL: API_BASE_URL,
    healthURL: HEALTH_URL,
    environment: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    hostname: window.location.hostname
  });
}
