/**
 * Environment Variables Validation
 * Validates that all required environment variables are present
 */

export interface AppEnvironment {
  apiBaseUrl: string;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  enableDebug: boolean;
  enableAnalytics: boolean;
}

export const validateEnvironment = (): AppEnvironment => {
  const nodeEnv = import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || 'development';
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';

  // Get API base URL with validation
  let apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!apiBaseUrl) {
    if (isDevelopment) {
      apiBaseUrl = 'http://localhost:3001/api';
      console.warn('⚠️ VITE_API_BASE_URL not set, using development default');
    } else {
      apiBaseUrl = 'https://weaveos.onrender.com/api';
      console.warn('⚠️ VITE_API_BASE_URL not set, using production default');
    }
  }

  const environment: AppEnvironment = {
    apiBaseUrl,
    nodeEnv,
    isProduction,
    isDevelopment,
    enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true' || isDevelopment,
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' && isProduction,
  };

  // Log environment info in development
  if (isDevelopment) {
    console.log('🔧 Environment Configuration:', environment);
  }

  return environment;
};

// Export singleton instance
export const ENV = validateEnvironment();
