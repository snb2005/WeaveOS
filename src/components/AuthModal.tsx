import { useState } from 'react';
import { User, Lock, Mail, Eye, EyeOff, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import useAuthStore from '../stores/authStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) clearError();
  };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        // Validation for registration
        if (formData.password !== formData.confirmPassword) {
          return; // This should be handled by the form validation
        }
        
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
      }
      
      // Close modal on successful auth
      onClose();
    } catch (err) {
      // Error is handled by the store
      console.error('Authentication error:', err);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    });
    clearError();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-theme-secondary/90 backdrop-blur-xl rounded-2xl border border-theme-glass shadow-2xl">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-500/20 rounded-full">
              {isLogin ? (
                <LogIn className="w-6 h-6 text-blue-400" />
              ) : (
                <UserPlus className="w-6 h-6 text-blue-400" />
              )}
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-center text-theme-primary mb-2">
            {isLogin ? 'Welcome Back' : 'Join Weave OS'}
          </h2>
          <p className="text-theme-secondary text-center text-sm">
            {isLogin 
              ? 'Sign in to access your workspace'
              : 'Create your account to get started'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* First Name & Last Name (Registration only) */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-theme-muted" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                             text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                             focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-theme-muted" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="w-full pl-10 pr-4 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                             text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                             focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-theme-muted" />
              <input
                type="email"
                name="email"
                placeholder={isLogin ? "Email Address" : "Email Address"}
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                         text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                         focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Username (Registration only) */}
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-theme-muted" />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full pl-10 pr-4 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                           text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                           focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-theme-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-12 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                         text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                         focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-theme-muted hover:text-theme-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password (Registration only) */}
            {!isLogin && (
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-theme-muted" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full pl-10 pr-12 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                           text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                           focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-theme-muted hover:text-theme-secondary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Password Validation (Registration only) */}
            {!isLogin && formData.password && (
              <div className="space-y-1">
                <div className={`text-xs flex items-center gap-2 ${
                  formData.password.length >= 8 ? 'text-green-400' : 'text-theme-muted'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    formData.password.length >= 8 ? 'bg-green-400' : 'bg-theme-muted'
                  }`} />
                  At least 8 characters
                </div>
                <div className={`text-xs flex items-center gap-2 ${
                  formData.confirmPassword && formData.password === formData.confirmPassword 
                    ? 'text-green-400' : 'text-theme-muted'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    formData.confirmPassword && formData.password === formData.confirmPassword 
                      ? 'bg-green-400' : 'bg-theme-muted'
                  }`} />
                  Passwords match
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || (!isLogin && formData.password !== formData.confirmPassword)}
            className="w-full mt-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 
                     disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all 
                     duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <span className="text-theme-secondary text-sm">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              type="button"
              onClick={switchMode}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
