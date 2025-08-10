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

  const { initialize, isAuthenticated, isLoading } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  
  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      await initialize();
      setAuthChecked(true);
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
  if (!authChecked || isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-purple-700 to-orange-500 flex items-center justify-center">
        <div className="text-white text-2xl font-light">Loading Weave OS...</div>
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
