import React, { useState, useEffect } from 'react';
import { useWindowStore } from '../store/windowStore';
import { getAppConfig } from '../registry/appRegistry';
import Terminal from '../apps/Terminal-xterm';
import Files from '../apps/Files';
import Calculator from '../apps/Calculator';
import Settings from '../apps/Settings';
import TextEditor from '../apps/TextEditor';
import Browser from '../apps/Browser';

interface DockItem {
  id: string;
  name: string;
  icon: string;
}

// App component mapping
const createAppComponent = (appName: string, props?: any) => {
  switch (appName) {
    case 'Files':
      return <Files {...props} />;
    case 'Terminal':
      return <Terminal {...props} />;
    case 'Calculator':
      return <Calculator {...props} />;
    case 'Settings':
      return <Settings {...props} />;
    case 'Text Editor':
      return <TextEditor {...props} />;
    case 'Browser':
      return <Browser {...props} />;
    default:
      return <div className="p-4 text-center">App "{appName}" coming soon!</div>;
  }
};

const MacDock: React.FC = () => {
  const { windows, openWindow, focusWindow } = useWindowStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [autoHide, setAutoHide] = useState(false);

  // Auto-hide logic
  useEffect(() => {
    const savedAutoHide = localStorage.getItem('weave-dock-autohide') === 'true';
    setAutoHide(savedAutoHide);
  }, []);

  useEffect(() => {
    if (!autoHide) {
      setIsHidden(false);
      return;
    }

    let hideTimer: NodeJS.Timeout;
    
    const handleMouseMove = (e: MouseEvent) => {
      const bottomDistance = window.innerHeight - e.clientY;
      
      if (bottomDistance < 100) {
        setIsHidden(false);
        clearTimeout(hideTimer);
      } else {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          setIsHidden(true);
        }, 1000);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Initially hide after 2 seconds
    hideTimer = setTimeout(() => {
      setIsHidden(true);
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(hideTimer);
    };
  }, [autoHide]);

  // Modern Ubuntu/macOS style dock items with enhanced icons
  const dockItems: DockItem[] = [
    { id: 'Files', name: 'Files', icon: '🗂️' },
    { id: 'Terminal', name: 'Terminal', icon: '⚫' },
    { id: 'Text Editor', name: 'Text Editor', icon: '📝' },
    { id: 'Calculator', name: 'Calculator', icon: '🔢' },
    { id: 'Browser', name: 'Browser', icon: '🌐' },
    { id: 'Settings', name: 'Settings', icon: '⚙️' },
    { id: 'Media Player', name: 'Media Player', icon: '🎵' },
  ];

  const handleAppClick = (appId: string, appName: string) => {
    // Find all windows for this app
    const appWindows = windows.filter((w: any) => w.app === appId && !w.minimized);
    
    if (appWindows.length === 0) {
      // No windows open, create new one
      const appConfig = getAppConfig(appName);
      
      if (appConfig) {
        const windowId = `${appId}-${Date.now()}`;
        
        openWindow(windowId, {
          title: appConfig.name,
          content: createAppComponent(appName),
          width: appConfig.width || 800,
          height: appConfig.height || 600,
          x: 100 + Math.random() * 200,
          y: 100 + Math.random() * 100,
        });
      }
    } else {
      // Focus the most recent window for this app
      const mostRecentWindow = appWindows.reduce((latest, current) => 
        (current.zIndex || 0) > (latest.zIndex || 0) ? current : latest
      );
      focusWindow(mostRecentWindow.id);
    }
  };

  const getRunningApps = () => {
    return windows
      .filter((w: any) => !w.minimized)
      .map((w: any) => w.app)
      .filter((app: string, index: number, arr: string[]) => arr.indexOf(app) === index);
  };

  const runningApps = getRunningApps();

  const toggleAutoHide = () => {
    const newAutoHide = !autoHide;
    setAutoHide(newAutoHide);
    localStorage.setItem('weave-dock-autohide', newAutoHide.toString());
    
    if (!newAutoHide) {
      setIsHidden(false);
    }
  };

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-in-out z-50 ${
      isHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
    }`}>
      {/* Dock Container */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-2xl">
        <div className="flex items-center space-x-1">
          {dockItems.map((item) => {
            const isRunning = runningApps.includes(item.id);
            const isHovered = hoveredItem === item.id;
            
            return (
              <div
                key={item.id}
                className="relative group"
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                    bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10
                    animate-in fade-in-0 zoom-in-95 duration-200">
                    {item.name}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                      border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
                
                {/* App Icon */}
                <button
                  onClick={() => handleAppClick(item.id, item.name)}
                  className={`dock-item
                    flex items-center justify-center w-16 h-16 rounded-xl
                    transition-all duration-200 ease-out
                    hover:scale-110 hover:-translate-y-1
                    ${isRunning 
                      ? 'bg-white/20 shadow-lg' 
                      : 'hover:bg-white/10'
                    }
                    ${isHovered ? 'scale-105' : 'scale-100'}
                  `}
                >
                  <span className="text-3xl filter drop-shadow-sm">
                    {item.icon}
                  </span>
                </button>
                
                {/* Running Indicator */}
                {isRunning && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2
                    w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
                )}
              </div>
            );
          })}
          
          {/* Divider */}
          <div className="w-px h-12 bg-white/20 mx-2"></div>
          
          {/* Auto-hide Toggle */}
          <div className="relative group">
            <button
              onClick={toggleAutoHide}
              className={`dock-item
                flex items-center justify-center w-12 h-12 rounded-xl
                transition-all duration-200 ease-out
                hover:scale-110 hover:-translate-y-1 hover:bg-white/10
                ${autoHide ? 'bg-blue-500/30' : 'bg-white/10'}
              `}
              title={autoHide ? 'Disable auto-hide' : 'Enable auto-hide'}
            >
              <span className="text-sm">
                {autoHide ? '📌' : '👁️'}
              </span>
            </button>
            
            {/* Auto-hide tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
              bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10
              opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {autoHide ? 'Disable auto-hide' : 'Enable auto-hide'}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacDock;
