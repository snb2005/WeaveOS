import TopBar from './components/TopBar';
import MacDock from './components/MacDock';
import Desktop from './components/Desktop';
import Window from './components/Window';
import TaskBar from './components/TaskBar';
import { useWindowManager } from './hooks/useWindowManager';
import { VFSDemo } from './filesystem/vfsDemo';
import runVFSValidation from './filesystem/vfsValidation';
import { vfsManager } from './filesystem/vfsManager';
import { WallpaperManager, ThemeManager } from './utils/wallpaperManager';
import { useEffect } from 'react';

function App() {
  const { 
    windows, 
    closeWindow, 
    focusWindow, 
    minimizeWindow, 
    toggleFullscreen
  } = useWindowManager();

  // Debug logging
  console.log('🖼️ Windows currently open:', windows.length, windows);    
  
  // Initialize VFS demo and validation when app loads
  useEffect(() => {
    console.log('🔧 Initializing Weave OS Virtual File System...');
    
    // Run basic demo
    VFSDemo.runDemo();
    
    // Run comprehensive validation
    console.log('\n🧪 Running VFS Validation Tests...');
    setTimeout(() => {
      runVFSValidation();
    }, 1000);
    
    // Run enhanced CRUD demo
    console.log('\n🎬 Running Enhanced CRUD Operations Demo...');
    setTimeout(() => {
      vfsManager.runCRUDDemo();
      vfsManager.runTerminalIntegrationDemo();
    }, 2000);
  }, []);

  // Initialize wallpaper and theme system
  useEffect(() => {
    console.log('🌅 Initializing wallpaper and theme system...');
    
    // Initialize theme and wallpaper managers
    const themeManager = ThemeManager.getInstance();
    const wallpaperManager = WallpaperManager.getInstance();
    
    themeManager.initializeFromStorage();
    wallpaperManager.initializeFromStorage();
    
    // Set default to live wallpaper if no preference exists
    const existingWallpaper = localStorage.getItem('weave-wallpaper');
    if (!existingWallpaper) {
      localStorage.setItem('weave-wallpaper', 'live');
      wallpaperManager.setWallpaper('live');
      console.log('🌅 Set default wallpaper to live wallpaper');
    }

    // Note: Time-based wallpaper is disabled when using live wallpaper to avoid conflicts
    console.log('🖼️ Wallpaper system initialized');
  }, []);

  const handleCreateFile = () => {
    // TODO: Implement file creation
    console.log('Creating new file...');
  };

  const handleCreateFolder = () => {
    // TODO: Implement folder creation
    console.log('Creating new folder...');
  };

  return (
    <div className="app">
      {/* Main Desktop Environment */}
      <Desktop onCreateFile={handleCreateFile} onCreateFolder={handleCreateFolder}>
        {/* Desktop content area - clean with no default text */}
        <div className="h-full"></div>

        {/* Render all open windows */}
        {windows.map((window, index) => {
          console.log(`🖼️ Rendering window ${index}:`, {
            id: window.id,
            title: window.title,
            top: window.top,
            left: window.left,
            width: window.width,
            height: window.height,
            zIndex: window.zIndex,
            isMinimized: window.isMinimized,
            isFullscreen: window.isFullscreen
          });
          
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
