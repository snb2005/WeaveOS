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
      {/* Ubuntu-style gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-700 to-orange-500"
        style={{
          background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 25%, #a855f7 50%, #d946ef 75%, #f97316 100%)'
        }}
      />
      
      {/* Overlay pattern */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Time and Date Display */}
      <div className="absolute top-8 left-8 text-white">
        <div className="text-6xl font-light mb-2">
          {formatTime(currentTime)}
        </div>
        <div className="text-xl opacity-80">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Weave OS Logo/Title */}
      <div className="absolute top-8 right-8 text-white text-right">
        <div className="text-3xl font-bold mb-1">Weave OS</div>
        <div className="text-lg opacity-80">Browser Operating System</div>
      </div>

      {/* Login/Register Card */}
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
        {/* Ubuntu-style user avatar */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
            <User size={40} className="text-white" />
          </div>
        </div>

        {/* Toggle between Login and Register */}
        <div className="flex bg-white/10 rounded-lg p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              isLogin 
                ? 'bg-white text-purple-900 shadow-lg' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              !isLogin 
                ? 'bg-white text-purple-900 shadow-lg' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-white/60" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
            />
          </div>

          {/* Username Field (Register only) */}
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-white/60" />
              </div>
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
              />
            </div>
          )}

          {/* First Name Field (Register only) */}
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-white/60" />
              </div>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
              />
            </div>
          )}

          {/* Last Name Field (Register only) */}
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-white/60" />
              </div>
              <input
                type="text"
                name="lastName"
                placeholder="Last Name (Optional)"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
              />
            </div>
          )}

          {/* Password Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-white/60" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white/80"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password Field (Register only) */}
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-white/60" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white/80"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 border border-white/30 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
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

        {/* Additional Info */}
        <div className="mt-6 text-center text-white/60 text-sm">
          {isLogin ? (
            <p>New to Weave OS? Click Register above to create an account.</p>
          ) : (
            <p>Already have an account? Click Sign In above to login.</p>
          )}
        </div>

        {/* Debug Test Button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={async () => {
              try {
                await login({
                  email: 'test@weave.com',
                  password: 'password123'
                });
                onAuthenticated();
              } catch (error) {
                console.error('❌ Test login failed:', error);
              }
            }}
            className="text-white/40 hover:text-white/60 text-xs underline transition-colors"
          >
            Test Login (Debug)
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="absolute bottom-8 left-8 text-white/60 text-sm">
        <div>Weave OS v1.0</div>
        <div>Browser-based Operating System</div>
      </div>

      {/* Power options placeholder */}
      <div className="absolute bottom-8 right-8 flex space-x-4 text-white/60">
        <button className="hover:text-white transition-colors p-2">
          <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
            <div className="w-2 h-2 border-t border-current"></div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
