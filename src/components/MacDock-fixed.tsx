import React, { useState, useEffect } from 'react';
import { useWindowStore } from '../store/windowStore';
import { getAppConfig } from '../registry/appRegistry';
import Terminal from '../apps/Terminal-enhanced';
import Files from '../apps/Files-enhanced';
import Calculator from '../apps/Calculator';
import Settings from '../apps/Settings-enhanced';
import TextEditor from '../apps/TextEditor-enhanced';
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
      return <Files 
        {...props} 
        onOpenFile={(fileName: string, filePath: string, content: string) => {
          const { openWindow } = useWindowStore.getState();
          const appConfig = getAppConfig('TextEditor');
          
          if (appConfig) {
            openWindow(`TextEditor-${filePath}`, {
              title: `${appConfig.name} - ${fileName}`,
              content: <TextEditor filePath={filePath} initialContent={content} fileName={fileName} />,
              width: appConfig.width || 800,
              height: appConfig.height || 600,
              top: 120 + Math.random() * 100,
              left: 120 + Math.random() * 100,
            });
          }
        }}
      />;
    case 'Terminal':
      return <Terminal {...props} />;
    case 'Calculator':
      return <Calculator {...props} />;
    case 'Settings':
      return <Settings {...props} />;
    case 'TextEditor':
      return <TextEditor {...props} />;
    case 'Text Editor':
      return <TextEditor {...props} />;
    case 'Browser':
      return <Browser {...props} />;
    default:
      return <div className="p-4">App not found: {appName}</div>;
  }
};

const MacDock: React.FC = () => {
  const { windows, openWindow, focusWindow } = useWindowStore();
  const [autoHide, setAutoHide] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [showMinimizedList, setShowMinimizedList] = useState<string | null>(null);

  const dockItems: DockItem[] = [
    { id: 'Files', name: 'Files', icon: '📁' },
    { id: 'Terminal', name: 'Terminal', icon: '💻' },
    { id: 'TextEditor', name: 'Text Editor', icon: '📝' },
    { id: 'Calculator', name: 'Calculator', icon: '🧮' },
    { id: 'Browser', name: 'Browser', icon: '🌐' },
    { id: 'Settings', name: 'Settings', icon: '⚙️' },
    { id: 'Media Player', name: 'Media Player', icon: '🎵' },
  ];

  const handleAppClick = (appId: string) => {
    console.log(`🎯 Dock click: ${appId}`, {
      existingWindows: windows.filter((w: any) => w.app === appId),
      totalWindows: windows.length
    });
    
    // Apps that support multiple instances
    const multiInstanceApps = ['Terminal', 'Files', 'TextEditor'];
    const supportsMultiple = multiInstanceApps.includes(appId);
    
    // Find all windows for this app (including minimized for single-instance apps)
    const appWindows = windows.filter((w: any) => w.app === appId);
    const visibleAppWindows = appWindows.filter((w: any) => !w.isMinimized);
    
    if (appWindows.length === 0) {
      // No windows exist, create new one
      const appConfig = getAppConfig(appId);
      
      console.log(`📱 Opening new window for ${appId}:`, appConfig);
      
      if (appConfig) {
        openWindow(appId, {
          title: appConfig.name,
          content: createAppComponent(appId),
          width: appConfig.width || 800,
          height: appConfig.height || 600,
          top: 100 + Math.random() * 200,
          left: 100 + Math.random() * 200,
          allowMultiple: supportsMultiple,
        });
      }
    } else if (supportsMultiple) {
      // For multi-instance apps, always create a new window
      const appConfig = getAppConfig(appId);
      
      console.log(`📱 Opening additional window for ${appId}:`, appConfig);
      
      if (appConfig) {
        openWindow(appId, {
          title: `${appConfig.name} ${appWindows.length + 1}`,
          content: createAppComponent(appId),
          width: appConfig.width || 800,
          height: appConfig.height || 600,
          top: 100 + Math.random() * 200,
          left: 100 + Math.random() * 200,
          allowMultiple: true,
        });
      }
    } else {
      // For single-instance apps, restore/focus existing window
      if (visibleAppWindows.length > 0) {
        // Focus the most recent visible window
        const mostRecentWindow = visibleAppWindows.reduce((latest, current) => 
          (current.zIndex || 0) > (latest.zIndex || 0) ? current : latest
        );
        console.log(`🔍 Focusing existing window:`, mostRecentWindow.id);
        focusWindow(mostRecentWindow.id);
      } else {
        // All windows are minimized, restore the most recent one
        const mostRecentWindow = appWindows.reduce((latest, current) => 
          (current.zIndex || 0) > (latest.zIndex || 0) ? current : latest
        );
        console.log(`📤 Restoring minimized window:`, mostRecentWindow.id);
        focusWindow(mostRecentWindow.id); // This should also unminimize
      }
    }
  };

  // Auto-hide functionality
  useEffect(() => {
    const savedAutoHide = localStorage.getItem('weave-dock-autohide') === 'true';
    setAutoHide(savedAutoHide);

    let timeout: NodeJS.Timeout;
    
    if (savedAutoHide) {
      const handleMouseMove = (e: MouseEvent) => {
        const distanceFromBottom = window.innerHeight - e.clientY;
        
        if (distanceFromBottom < 100) {
          setIsHidden(false);
          clearTimeout(timeout);
        } else {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            setIsHidden(true);
          }, 2000);
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timeout);
      };
    }
  }, [autoHide]);

  const getRunningApps = () => {
    return [...new Set(windows.filter(w => w.isVisible).map(w => w.app))];
  };

  const getMinimizedWindows = (appId: string) => {
    return windows.filter(w => w.app === appId && w.isMinimized && w.isVisible);
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
            const isHovered = hoveredApp === item.id;
            const minimizedWindows = getMinimizedWindows(item.id);
            const hasMinimized = minimizedWindows.length > 0;

            return (
              <div key={item.id} className="relative">
                {/* Minimized Windows Popup */}
                {showMinimizedList === item.id && hasMinimized && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
                    bg-zinc-800/95 backdrop-blur-sm border border-zinc-600/50 rounded-xl p-2
                    shadow-2xl min-w-64 z-50">
                    <div className="text-zinc-300 text-xs font-medium mb-2 px-2">
                      Minimized {item.name} Windows
                    </div>
                    <div className="space-y-1">
                      {minimizedWindows.map((window) => (
                        <button
                          key={window.id}
                          onClick={() => {
                            focusWindow(window.id);
                            setShowMinimizedList(null);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-700/50
                            transition-all duration-200 text-left"
                        >
                          <span className="text-lg">{item.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">
                              {window.title}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* App Icon */}
                <button
                  onMouseEnter={() => setHoveredApp(item.id)}
                  onMouseLeave={() => {
                    setHoveredApp(null);
                    setTimeout(() => setShowMinimizedList(null), 100);
                  }}
                  onClick={() => {
                    // If there are minimized windows, show them; otherwise open/focus app
                    if (hasMinimized) {
                      setShowMinimizedList(showMinimizedList === item.id ? null : item.id);
                    } else {
                      handleAppClick(item.id);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    // Right-click always creates a new instance for multi-instance apps
                    const multiInstanceApps = ['Terminal', 'Files', 'TextEditor'];
                    if (multiInstanceApps.includes(item.id)) {
                      const appConfig = getAppConfig(item.id);
                      if (appConfig) {
                        const existingWindows = windows.filter((w: any) => w.app === item.id);
                        openWindow(item.id, {
                          title: `${appConfig.name} ${existingWindows.length + 1}`,
                          content: createAppComponent(item.id),
                          width: appConfig.width || 800,
                          height: appConfig.height || 600,
                          top: 100 + Math.random() * 200,
                          left: 100 + Math.random() * 200,
                          allowMultiple: true,
                        });
                      }
                    }
                  }}
                  className={`dock-item
                    flex items-center justify-center w-16 h-16 rounded-xl
                    transition-all duration-200 ease-out
                    hover:scale-110 hover:-translate-y-1
                    ${isRunning 
                      ? 'bg-white/20 shadow-lg' 
                      : 'hover:bg-white/10'
                    }
                    ${hasMinimized ? 'ring-2 ring-yellow-400/50' : ''}
                    ${isHovered ? 'scale-105' : 'scale-100'}
                  `}
                >
                  <span className="text-3xl filter drop-shadow-sm">
                    {item.icon}
                  </span>
                </button>
                
                {/* Running Indicator */}
                {isRunning && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                    {(() => {
                      const multiInstanceApps = ['Terminal', 'Files', 'TextEditor'];
                      const isMultiInstance = multiInstanceApps.includes(item.id);
                      const instanceCount = windows.filter((w: any) => w.app === item.id && w.isVisible).length;
                      
                      if (isMultiInstance && instanceCount > 1) {
                        return (
                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(instanceCount, 3) }, (_, i) => (
                              <div key={i} className="w-1 h-1 bg-white rounded-full shadow-sm"></div>
                            ))}
                            {instanceCount > 3 && (
                              <div className="w-1 h-1 bg-white/60 rounded-full shadow-sm"></div>
                            )}
                          </div>
                        );
                      } else {
                        return <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>;
                      }
                    })()}
                  </div>
                )}

                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                    bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10
                    animate-in fade-in-0 zoom-in-95 duration-200">
                    {(() => {
                      const multiInstanceApps = ['Terminal', 'Files', 'TextEditor'];
                      const isMultiInstance = multiInstanceApps.includes(item.id);
                      const instanceCount = windows.filter((w: any) => w.app === item.id && w.isVisible).length;
                      
                      if (hasMinimized) {
                        return `${item.name} (${minimizedWindows.length} minimized) • Click to restore`;
                      } else if (isMultiInstance && instanceCount > 0) {
                        return `${item.name} (${instanceCount} window${instanceCount !== 1 ? 's' : ''}) • Right-click or double-click for new`;
                      } else if (isMultiInstance) {
                        return `${item.name} • Right-click or double-click for new instance`;
                      } else {
                        return item.name;
                      }
                    })()}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 
                      border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
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
