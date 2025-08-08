import React, { useState, useEffect } from 'react';
import ContextMenu from './ContextMenu';
import { WallpaperManager } from '../utils/wallpaperManager';
import WindowManager from './WindowManager';
import DesktopWidgets from './DesktopWidgets';

interface DesktopProps {
  children?: React.ReactNode;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
}

const Desktop: React.FC<DesktopProps> = ({ children, onCreateFile, onCreateFolder }) => {
  const [wallpaperManager] = useState(() => WallpaperManager.getInstance());
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    position: { x: number; y: number };
  }>({
    visible: false,
    position: { x: 0, y: 0 },
  });

  useEffect(() => {
    // Listen for settings changes from the Settings app
    const handleSettingsChange = (event: CustomEvent) => {
      if (event.detail?.wallpaper) {
        console.log('🔄 Desktop received wallpaper change:', event.detail.wallpaper);
        wallpaperManager.setWallpaper(event.detail.wallpaper);
      }
    };

    window.addEventListener('weave-settings-changed', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('weave-settings-changed', handleSettingsChange as EventListener);
    };
  }, [wallpaperManager]);

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
        // Cycle through wallpapers using WallpaperManager
        const wallpapers = ['gradient-blue', 'gradient-sunset', 'gradient-forest', 'gradient-space', 'live'];
        const currentWallpaper = wallpaperManager.getCurrentWallpaper();
        const currentIndex = wallpapers.indexOf(currentWallpaper);
        const nextWallpaper = wallpapers[(currentIndex + 1) % wallpapers.length];
        
        wallpaperManager.setWallpaper(nextWallpaper);
        
        // Show notification
        const wallpaperNames = {
          'gradient-blue': 'Blue Gradient',
          'gradient-sunset': 'Sunset Gradient', 
          'gradient-forest': 'Forest Gradient',
          'gradient-space': 'Space Gradient',
          'live': 'Live Wallpaper'
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
        className="desktop-background w-full h-full relative overflow-hidden"
        style={{ background: 'transparent' }}
        onContextMenu={handleRightClick}
      >
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-white/10 via-transparent to-transparent" />
        {/* Desktop Widgets - Rendered outside desktop container for proper z-index */}
        <DesktopWidgets />
        {/* Desktop content area with WindowManager */}
        <div className="relative z-10 w-full h-full pt-8 pb-20">
          <WindowManager>
            {children}
          </WindowManager>
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
