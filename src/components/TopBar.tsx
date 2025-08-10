import { useState, useEffect } from 'react';
import { useWindowStore } from '../store/windowStore';
import { ThemeManager } from '../utils/wallpaperManager';
import useAuthStore from '../stores/authStore';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import Settings from '../apps/Settings';
import Files from '../apps/Files';
import Terminal from '../apps/Terminal';
import TextEditorEnhanced from '../apps/TextEditor';
import Calculator from '../apps/Calculator';

interface TopBarProps {}

const TopBar: React.FC<TopBarProps> = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAppleMenu, setShowAppleMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { openWindow } = useWindowStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowAppleMenu(false);
      setShowFileMenu(false);
      setShowEditMenu(false);
      setShowViewMenu(false);
      setShowControlCenter(false);
      setShowAuthModal(false);
      setShowUserProfile(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowControlCenter(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleOpenApp = (appName: string) => {
    const apps = {
      'Settings': () => openWindow('settings', { 
        title: 'Settings', 
        content: <Settings />, 
        top: 100, 
        left: 100, 
        width: 900, 
        height: 600 
      }),
      'Files': () => openWindow('files', { 
        title: 'Files', 
        content: <Files />, 
        top: 120, 
        left: 120, 
        width: 1000, 
        height: 700 
      }),
      'Terminal': () => openWindow('terminal', { 
        title: 'Terminal', 
        content: <Terminal />, 
        top: 140, 
        left: 140, 
        width: 800, 
        height: 500 
      }),
      'TextEditor': () => openWindow('texteditor', { 
        title: 'Text Editor', 
        content: <TextEditorEnhanced />, 
        top: 160, 
        left: 160, 
        width: 900, 
        height: 600 
      }),
      'Calculator': () => openWindow('calculator', { 
        title: 'Calculator', 
        content: <Calculator />, 
        top: 180, 
        left: 180, 
        width: 320, 
        height: 480 
      }),
    };
    
    if (apps[appName as keyof typeof apps]) {
      apps[appName as keyof typeof apps]();
    }
  };

  const handleRestart = () => {
    if (confirm('Are you sure you want to restart Weave OS?')) {
      window.location.reload();
    }
  };

  const handleSleep = () => {
    // Simulate sleep by dimming the screen
    document.body.style.filter = 'brightness(0.1)';
    setTimeout(() => {
      document.body.style.filter = 'brightness(1)';
    }, 2000);
  };

  const handleThemeToggle = () => {
    const themeManager = ThemeManager.getInstance();
    const currentTheme = localStorage.getItem('weave-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    themeManager.setTheme(newTheme);
  };

  const MenuButton = ({ children, onClick, show }: { children: React.ReactNode, onClick: (e: React.MouseEvent) => void, show?: boolean }) => (
    <button 
      style={{
        background: show ? 'rgba(255, 255, 255, 0.15)' : 'none',
        border: 'none',
        color: 'var(--text-primary)',
        fontSize: '13px',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '4px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!show) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        if (!show) e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );

  const DropdownMenu = ({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) => (
    <div 
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        minWidth: '200px',
        backgroundColor: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '8px',
        padding: '8px 0',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid var(--glass-border)',
        zIndex: 1001,
        ...style
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );

  const MenuItem = ({ children, onClick, shortcut }: { children: React.ReactNode, onClick: () => void, shortcut?: string }) => (
    <button
      style={{
        width: '100%',
        padding: '8px 16px',
        border: 'none',
        background: 'none',
        color: 'var(--text-primary)',
        fontSize: '13px',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      onClick={onClick}
    >
      <span>{children}</span>
      {shortcut && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{shortcut}</span>}
    </button>
  );

  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '32px',
          backgroundColor: 'var(--bg-secondary)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-color)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--text-primary)',
          userSelect: 'none',
        }}
      >
        {/* Left side - Apple menu and app menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <MenuButton 
              onClick={(e) => { e.stopPropagation(); setShowAppleMenu(!showAppleMenu); }}
              show={showAppleMenu}
            >
              🍎
            </MenuButton>
            
            {showAppleMenu && (
              <DropdownMenu>
                <MenuItem onClick={() => handleOpenApp('Settings')}>About Weave OS</MenuItem>
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />
                <MenuItem onClick={() => handleOpenApp('Settings')}>System Preferences...</MenuItem>
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />
                <MenuItem onClick={handleSleep}>Sleep</MenuItem>
                <MenuItem onClick={handleRestart}>Restart...</MenuItem>
              </DropdownMenu>
            )}
          </div>
          
          <span style={{ fontWeight: '600' }}>Weave OS</span>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <MenuButton 
                onClick={(e) => { e.stopPropagation(); setShowFileMenu(!showFileMenu); }}
                show={showFileMenu}
              >
                File
              </MenuButton>
              
              {showFileMenu && (
                <DropdownMenu>
                  <MenuItem onClick={() => handleOpenApp('Files')} shortcut="⌘O">Open Files</MenuItem>
                  <MenuItem onClick={() => handleOpenApp('TextEditor')} shortcut="⌘N">New Document</MenuItem>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />
                  <MenuItem onClick={() => handleOpenApp('Terminal')} shortcut="⌘T">Open Terminal</MenuItem>
                </DropdownMenu>
              )}
            </div>
            
            <div style={{ position: 'relative' }}>
              <MenuButton 
                onClick={(e) => { e.stopPropagation(); setShowEditMenu(!showEditMenu); }}
                show={showEditMenu}
              >
                Edit
              </MenuButton>
              
              {showEditMenu && (
                <DropdownMenu>
                  <MenuItem onClick={() => {}} shortcut="⌘Z">Undo</MenuItem>
                  <MenuItem onClick={() => {}} shortcut="⌘Y">Redo</MenuItem>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />
                  <MenuItem onClick={() => {}} shortcut="⌘X">Cut</MenuItem>
                  <MenuItem onClick={() => {}} shortcut="⌘C">Copy</MenuItem>
                  <MenuItem onClick={() => {}} shortcut="⌘V">Paste</MenuItem>
                </DropdownMenu>
              )}
            </div>
            
            <div style={{ position: 'relative' }}>
              <MenuButton 
                onClick={(e) => { e.stopPropagation(); setShowViewMenu(!showViewMenu); }}
                show={showViewMenu}
              >
                View
              </MenuButton>
              
              {showViewMenu && (
                <DropdownMenu>
                  <MenuItem onClick={handleThemeToggle}>Toggle Theme</MenuItem>
                  <MenuItem onClick={() => handleOpenApp('Calculator')}>Calculator</MenuItem>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }} />
                  <MenuItem onClick={() => handleOpenApp('Settings')}>Preferences</MenuItem>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Right side - System indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* User Authentication Area */}
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => setShowUserProfile(true)}
                title={`Signed in as ${user.firstName} ${user.lastName}`}
              >
                <div 
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: '600',
                    color: 'white'
                  }}
                >
                  {user.firstName?.charAt(0) || user.username?.charAt(0) || 'U'}
                </div>
                <span style={{ fontSize: '12px', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.firstName || user.username}
                </span>
              </div>
              
              {/* Quick Logout Button */}
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  opacity: '0.7',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '0.7';
                }}
                onClick={handleLogout}
                title="Sign Out"
              >
                🚪
              </button>
            </div>
          ) : (
            <button 
              style={{
                background: 'var(--accent-color)',
                border: 'none',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onClick={() => setShowAuthModal(true)}
            >
              Sign In
            </button>
          )}

          {/* Control Center */}
          <div style={{ position: 'relative' }}>
            <button 
              style={{
                background: showControlCenter ? 'rgba(255, 255, 255, 0.15)' : 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!showControlCenter) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                if (!showControlCenter) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={(e) => { e.stopPropagation(); setShowControlCenter(!showControlCenter); }}
              title="Control Center"
            >
              ⚙️
            </button>

            {showControlCenter && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: '280px',
                  backgroundColor: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  zIndex: 1001,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Control Center</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button 
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'center',
                      color: 'var(--text-primary)',
                    }}
                    onClick={handleThemeToggle}
                  >
                    🌓 Theme
                  </button>
                  <button 
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'center',
                      color: 'var(--text-primary)',
                    }}
                    onClick={() => handleOpenApp('Settings')}
                  >
                    ⚙️ Settings
                  </button>
                  <button 
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'center',
                      color: 'var(--text-primary)',
                    }}
                    onClick={() => handleOpenApp('Files')}
                  >
                    📁 Files
                  </button>
                  <button 
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'center',
                      color: 'var(--text-primary)',
                    }}
                    onClick={() => handleOpenApp('Terminal')}
                  >
                    💻 Terminal
                  </button>
                </div>
                
                {/* User Actions */}
                {isAuthenticated && (
                  <>
                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '12px 0' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button 
                        style={{
                          padding: '12px',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textAlign: 'center',
                          color: 'var(--text-primary)',
                        }}
                        onClick={() => setShowUserProfile(true)}
                      >
                        👤 Profile
                      </button>
                      <button 
                        style={{
                          padding: '12px',
                          backgroundColor: 'var(--bg-tertiary)',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          textAlign: 'center',
                          color: 'var(--text-primary)',
                        }}
                        onClick={handleLogout}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Battery */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <span>🔋</span>
            <span>87%</span>
          </div>

          {/* Date and Time */}
          <div 
            style={{
              fontSize: '13px',
              textAlign: 'right',
              lineHeight: '1.2',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Current Date and Time"
          >
            <div>{formatDate(currentTime)}</div>
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{formatTime(currentTime)}</div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <UserProfile 
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
    </>
  );
};

export default TopBar;
