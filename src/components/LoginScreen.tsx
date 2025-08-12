import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, Mail, Loader } from 'lucide-react';
import useAuthStore from '../stores/authStore.js';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { login, register, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      onAuthenticated();
    }
  }, [isAuthenticated, onAuthenticated]);

  // Test API connectivity when component mounts
  useEffect(() => {
    const testApiConnectivity = async () => {
      try {
        await fetch('http://localhost:3001/health');
        
        // Test CORS with a simple auth endpoint
        try {
          await fetch('http://localhost:3001/api/auth/me', {
            headers: {
              'Authorization': 'Bearer invalid-token'
            },
            credentials: 'include'
          });
        } catch (corsError) {
          // Expected to fail with auth error
        }
        
      } catch (error) {
        console.error('❌ API connectivity test failed:', error);
        
        // Show error message on screen
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          position: fixed;
          top: 20px;
          left: 20px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          padding: 16px;
          border-radius: 8px;
          max-width: 400px;
          z-index: 1000;
          font-family: system-ui, -apple-system, sans-serif;
        `;
        errorDiv.textContent = `Cannot connect to backend server. Please ensure the server is running on port 3001.`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
          if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
          }
        }, 8000);
      }
    };
    
    testApiConnectivity();
  }, []);

  // Clear error when switching between login/register
  useEffect(() => {
    clearError();
    setFormData({
      email: '',
      password: '',
      username: '',
      firstName: '',
      lastName: '',
      confirmPassword: ''
    });
  }, [isLogin, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Form submission started');
    
    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await register({
          email: formData.email,
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password
        });
      }
      onAuthenticated();
    } catch (err) {
      console.error('❌ Authentication error:', err);
      
      // Display a user-friendly error message on the screen
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(239, 68, 68, 0.9);
        color: white;
        padding: 16px;
        border-radius: 8px;
        max-width: 400px;
        z-index: 1000;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      errorDiv.textContent = `Authentication Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`;
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        document.body.removeChild(errorDiv);
      }, 5000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Professional dark gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #374151 50%, #4b5563 75%, #374151 100%)'
        }}
      />
      
      {/* Subtle geometric pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>
      
      {/* Time and Date Display - Professional styling */}
      <div className="absolute top-8 left-8 text-gray-100">
        <div className="text-5xl font-extralight mb-1 tracking-tight">
          {formatTime(currentTime)}
        </div>
        <div className="text-lg text-gray-300 font-light">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Weave OS Branding - Professional layout */}
      <div className="absolute top-8 right-8 text-right">
        <div className="text-2xl font-bold text-white mb-1 tracking-wide">WEAVE OS</div>
        <div className="text-sm text-gray-300 font-medium tracking-wider uppercase">
          Enterprise Operating System
        </div>
      </div>

      {/* Professional Login/Register Card */}
      <div className="relative bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-xl p-8 w-full max-w-md mx-4 shadow-2xl">
        {/* Minimalist header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-gray-400 text-sm">
            {isLogin ? 'Sign in to your workspace' : 'Create your account'}
          </p>
        </div>

        {/* Sleek Toggle Buttons */}
        <div className="flex bg-gray-800/80 rounded-lg p-1 mb-8">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${
              isLogin 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${
              !isLogin 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}
          >
            Register
          </button>
        </div>

        {/* Professional Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* Username Field (Register only) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>
          )}

          {/* First & Last Name Fields (Register only) */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-12 py-3 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Register only) */}
          {!isLogin && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-gray-800/60 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
              </div>
              <div>
                <p className="text-red-400 text-sm font-medium">Authentication Error</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Professional Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Professional Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          {isLogin ? (
            <p>New to Weave OS? <span className="text-blue-400 font-medium">Register above</span> to create an account.</p>
          ) : (
            <p>Already have an account? <span className="text-blue-400 font-medium">Sign In above</span> to continue.</p>
          )}
        </div>
      </div>

      {/* Professional System Info */}
      <div className="absolute bottom-8 left-8 text-gray-400 text-sm">
        <div className="font-semibold">Weave OS v1.0</div>
        <div className="text-gray-500">Enterprise Browser Platform</div>
      </div>

      {/* Minimalist Power Options */}
      <div className="absolute bottom-8 right-8 flex space-x-4 text-gray-500">
        <button className="hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-800/30">
          <div className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
            <div className="w-1 h-1 bg-current rounded-full"></div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
