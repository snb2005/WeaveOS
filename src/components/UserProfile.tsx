import { useState, useEffect } from 'react';
import { User, Settings, HardDrive, Lock, LogOut, Save, AlertCircle, CheckCircle } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import apiClient from '../services/apiClient';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile = ({ isOpen, onClose }: UserProfileProps) => {
  const { user, logout, updateProfile, changePassword, isLoading, error, clearError } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      loadStorageInfo();
    }
  }, [isOpen]);

  const loadStorageInfo = async () => {
    try {
      const response = await apiClient.getUserStorage();
      setStorageInfo((response as any).storage || response.data);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    try {
      await updateProfile(profileData);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return;
    }
    
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccessMessage('Password changed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Password change failed:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isOpen || !user) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'security', label: 'Security', icon: Lock }
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-theme-secondary/90 backdrop-blur-xl rounded-2xl border border-theme-glass shadow-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-theme-glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Settings className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-theme-primary">User Settings</h2>
                <p className="text-theme-secondary text-sm">
                  {user.firstName} {user.lastName} (@{user.username})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-theme-tertiary/50 rounded-lg transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] scrollbar-thin">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-green-400 text-sm">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full px-4 py-3 bg-theme-tertiary/30 border border-theme-glass rounded-lg 
                           text-theme-muted cursor-not-allowed"
                />
                <p className="text-xs text-theme-muted mt-1">Username cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme-primary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 bg-theme-tertiary/30 border border-theme-glass rounded-lg 
                           text-theme-muted cursor-not-allowed"
                />
                <p className="text-xs text-theme-muted mt-1">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                             text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                             focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                             text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                             focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 
                         disabled:bg-blue-500/50 text-white rounded-lg transition-all"
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Storage Tab */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              {storageInfo && (
                <>
                  <div className="bg-theme-tertiary/30 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-theme-primary mb-4">Storage Usage</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-theme-secondary">Used</span>
                        <span className="text-theme-primary font-medium">{storageInfo.formattedUsed}</span>
                      </div>
                      
                      <div className="w-full bg-theme-tertiary/50 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(storageInfo.usagePercent, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-theme-secondary">Available</span>
                        <span className="text-theme-primary font-medium">{storageInfo.formattedAvailable}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-theme-secondary">Total Quota</span>
                        <span className="text-theme-primary font-medium">{storageInfo.formattedQuota}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-theme-tertiary/30 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-theme-primary mb-2">Account Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-theme-secondary">Role</span>
                        <span className="text-theme-primary capitalize">{user.role}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-theme-secondary">Member Since</span>
                        <span className="text-theme-primary">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {user.lastLogin && (
                        <div className="flex justify-between">
                          <span className="text-theme-secondary">Last Login</span>
                          <span className="text-theme-primary">
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <h3 className="text-lg font-medium text-theme-primary">Change Password</h3>
                
                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                             text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                             focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                             text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                             focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-theme-tertiary/50 border border-theme-glass rounded-lg 
                             text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 
                             focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                </div>

                {passwordData.newPassword && passwordData.confirmPassword && 
                 passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-red-400 text-sm">Passwords do not match</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || passwordData.newPassword !== passwordData.confirmPassword}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 
                           disabled:bg-blue-500/50 text-white rounded-lg transition-all"
                >
                  <Lock className="w-4 h-4" />
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>

              <div className="border-t border-theme-glass pt-6">
                <h3 className="text-lg font-medium text-theme-primary mb-2">Sign Out</h3>
                <p className="text-theme-secondary text-sm mb-4">
                  Sign out of your account on this device.
                </p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 
                           text-white rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
