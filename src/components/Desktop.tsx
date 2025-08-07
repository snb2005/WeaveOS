import React, { useState, useEffect } from 'react';
import ContextMenu from './ContextMenu';
import { getTimeBasedWallpaperStyle } from '../utils/timeBasedWallpaper';

interface DesktopProps {
  children?: React.ReactNode;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
}

const Desktop: React.FC<DesktopProps> = ({ children, onCreateFile, onCreateFolder }) => {
  const [wallpaper, setWallpaper] = useState('time-based');
  const [timeBasedUpdate, setTimeBasedUpdate] = useState(0); // Force re-render for time-based updates
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
  }>({
    visible: false,
    position: { x: 0, y: 0 },
  });

  useEffect(() => {
    // Load wallpaper preference from localStorage, default to time-based
    const savedWallpaper = localStorage.getItem('weave-wallpaper') || 'time-based';
    setWallpaper(savedWallpaper);

    // Listen for settings changes
    const handleSettingsChange = (event: CustomEvent) => {
      if (event.detail?.wallpaper) {
        setWallpaper(event.detail.wallpaper);
        localStorage.setItem('weave-wallpaper', event.detail.wallpaper);
      }
    };

    window.addEventListener('weave-settings-changed', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('weave-settings-changed', handleSettingsChange as EventListener);
    };
  }, []);

  // Auto-update time-based wallpaper every hour
  useEffect(() => {
    if (wallpaper === 'time-based') {
      // Update immediately when time-based wallpaper is selected
      const updateWallpaper = () => {
        // Force a re-render by updating the timeBasedUpdate state
        setTimeBasedUpdate(prev => prev + 1);
        console.log('🌅 Time-based wallpaper updated at:', new Date().toLocaleTimeString());
      };

      // Set up interval to update every hour
      const intervalId = setInterval(updateWallpaper, 60 * 60 * 1000); // 1 hour

      return () => clearInterval(intervalId);
    }
  }, [wallpaper]);

  const getWallpaperStyle = () => {
    // If time-based wallpaper is selected, use the time-based function
    // The timeBasedUpdate dependency ensures this re-runs when time changes
    if (wallpaper === 'time-based') {
      return {
        ...getTimeBasedWallpaperStyle(),
        // Add a key based on timeBasedUpdate to force re-evaluation
        ...(timeBasedUpdate && {})
      };
    }

    const wallpapers = {
      custom: {
        backgroundImage: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      },
      monterey: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      bigsur: {
        background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      },
      catalina: {
        background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      },
      dark: {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      },
      light: {
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      },
      'gradient-1': {
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
      },
      'gradient-2': {
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
      },
      'gradient-3': {
        background: 'linear-gradient(135deg, #581c87 0%, #7c2d12 50%, #dc2626 100%)',
      },
    };
    
    return wallpapers[wallpaper as keyof typeof wallpapers] || wallpapers.monterey;
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Only show context menu if clicking on desktop (not on children)
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('desktop-clickable')) {
      setContextMenu({
        visible: true,
        position: { x: e.clientX, y: e.clientY },
      });
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  const contextMenuItems = [
    {
      id: 'new-folder',
      label: 'New Folder',
      icon: '📁',
      action: () => {
        if (onCreateFolder) onCreateFolder();
      },
    },
    {
      id: 'new-file',
      label: 'New File',
      icon: '📄',
      action: () => {
        if (onCreateFile) onCreateFile();
      },
    },
    {
      id: 'separator-1',
      label: '',
      separator: true,
      action: () => {},
    },
    {
      id: 'refresh',
      label: 'Refresh Desktop',
      icon: '🔄',
      action: () => {
        window.location.reload();
      },
    },
    {
      id: 'separator-2',
      label: '',
      separator: true,
      action: () => {},
    },
    {
      id: 'wallpaper',
      label: 'Change Wallpaper',
      icon: '🖼️',
      action: () => {
        // Cycle through wallpapers
        const wallpapers = ['custom', 'monterey', 'bigsur', 'catalina', 'dark', 'light'];
        const currentIndex = wallpapers.indexOf(wallpaper);
        const nextWallpaper = wallpapers[(currentIndex + 1) % wallpapers.length];
        setWallpaper(nextWallpaper);
        localStorage.setItem('weave-wallpaper', nextWallpaper);
        
        // Show notification
        const wallpaperNames = {
          custom: 'Custom Background',
          monterey: 'macOS Monterey',
          bigsur: 'macOS Big Sur', 
          catalina: 'macOS Catalina',
          dark: 'Dark Theme',
          light: 'Light Theme'
        };
        
        // Dispatch notification event
        window.dispatchEvent(new CustomEvent('weave-notification', {
          detail: {
            title: 'Wallpaper Changed',
            message: `Switched to ${wallpaperNames[nextWallpaper as keyof typeof wallpaperNames]}`,
            type: 'success'
          }
        }));
      },
    },
    {
      id: 'separator-3',
      label: '',
      separator: true,
      action: () => {},
    },
    {
      id: 'properties',
      label: 'Desktop Properties',
      icon: '⚙️',
      action: () => {
        // TODO: Open desktop properties dialog
        console.log('Opening desktop properties...');
      },
    },
  ];

  return (
    <>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          ...getWallpaperStyle(),
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.5s ease',
        }}
        onContextMenu={handleRightClick}
        className="desktop-clickable"
      >
        {/* Subtle overlay for depth */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        
        {/* Desktop content area */}
        <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', paddingTop: '32px', paddingBottom: '80px' }}>
          {children}
        </div>
      </div>
      
      <ContextMenu
        items={contextMenuItems}
        position={contextMenu.position}
        visible={contextMenu.visible}
        onClose={handleCloseContextMenu}
      />
    </>
  );
};

export default Desktop;
