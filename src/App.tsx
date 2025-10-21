import TopBar from './components/TopBar';
import MacDock from './components/MacDock';
import Desktop from './components/Desktop';
import Window from './components/Window';
import TaskBar from './components/TaskBar';
import LoginScreen from './components/LoginScreen';
import { useWindowManager } from './hooks/useWindowManager';
import useAuthStore from './stores/authStore';
import { WallpaperManager, ThemeManager } from './utils/wallpaperManager';
import { useEffect, useState } from 'react';

function App() {
  const { 
    windows, 
    closeWindow, 
    focusWindow, 
    minimizeWindow, 
    toggleFullscreen
  } = useWindowManager();

  const { initialize, isAuthenticated, isLoading, error } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  
  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initialize();
      } catch (e) {
        console.error('Failed to initialize auth:', e);
      } finally {
        setAuthChecked(true);
      }
    };
    initAuth();
  }, [initialize]);    
  
  // Initialize wallpaper and theme system (only after authentication)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Initialize theme and wallpaper managers
    const themeManager = ThemeManager.getInstance();
    const wallpaperManager = WallpaperManager.getInstance();
    
    themeManager.initializeFromStorage();
    wallpaperManager.initializeFromStorage();
    
    // Set default wallpaper if no preference exists
    const existingWallpaper = localStorage.getItem('weave-wallpaper');
    if (!existingWallpaper) {
      localStorage.setItem('weave-wallpaper', 'default');
      wallpaperManager.setWallpaper('default');
    }
  }, [isAuthenticated]);

  const handleCreateFile = () => {
    // TODO: Implement file creation
  };

  const handleCreateFolder = () => {
    // TODO: Implement folder creation
  };

  const handleAuthenticated = () => {
    // Authentication successful
  };

  // Show loading screen while checking authentication
  // But show error state if auth check fails
  if (!authChecked || isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex items-center justify-center">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
        
        {/* Loading content */}
        <div className="text-center space-y-8">
          {/* Professional logo/branding */}
          <div className="space-y-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl overflow-hidden">
              <img 
                src="/images/logo.png" 
                alt="Weave OS Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-wide">WEAVE OS</h1>
              <p className="text-gray-400 text-sm font-medium tracking-wider uppercase mt-2">
                Enterprise Operating System
              </p>
            </div>
          </div>
          
          {/* Professional loading spinner or error */}
          <div className="space-y-6">
            {!error ? (
              <>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-gray-700 rounded-full animate-spin border-t-blue-500"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent rounded-full animate-pulse border-t-blue-400"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-white text-lg font-medium">Loading Workspace</p>
                  <p className="text-gray-400 text-sm">Please wait while we prepare your environment...</p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="text-yellow-500">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-white text-lg font-medium">Connection Issue</p>
                  <p className="text-gray-400 text-sm">Unable to connect to the server. Redirecting to login...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Loading progress indicator */}
          {!error && (
            <div className="w-64 bg-gray-800 rounded-full h-1 mx-auto">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="absolute bottom-8 text-center w-full">
          <p className="text-gray-500 text-sm">
            {error ? 'Please check your internet connection' : 'Powered by advanced web technologies'}
          </p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onAuthenticated={handleAuthenticated} />;
  }

  // Show desktop if authenticated
  return (
    <div className="app">
      {/* Main Desktop Environment */}
      <Desktop onCreateFile={handleCreateFile} onCreateFolder={handleCreateFolder}>
        {/* Desktop content area - clean with no default text */}
        <div className="h-full"></div>

        {/* Render all open windows */}
        {windows.map((window) => {
          return (
            <Window
              key={window.id}
              id={window.id}
              title={window.title}
              initialTop={window.top}
              initialLeft={window.left}
              width={window.width}
              height={window.height}
              zIndex={window.zIndex}
              onClose={closeWindow}
              onFocus={focusWindow}
              onMinimize={minimizeWindow}
              isMinimized={window.isMinimized}
              isFullscreen={window.isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            >
              {window.content}
            </Window>
          );
        })}
      </Desktop>

      {/* Top Bar - System panel */}
      <TopBar />

      {/* TaskBar for minimized windows */}
      <TaskBar />

      {/* Mac-style Dock */}
      <MacDock />
    </div>
  );
}

export default App;
