import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface WindowData {
  id: string;
  appName: string;
  title: string;
  content: ReactNode;
  top: number;
  left: number;
  width: number;
  height: number;
  zIndex: number;
  isVisible: boolean;
  isMinimized: boolean;
}

interface WindowManagerContextType {
  windows: WindowData[];
  openWindow: (appName: string, windowConfig: Omit<WindowData, 'id' | 'zIndex' | 'isVisible' | 'isMinimized' | 'appName'>) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  getMaxZIndex: () => number;
  getWindowByAppName: (appName: string) => WindowData | undefined;
}

const WindowManagerContext = createContext<WindowManagerContextType | undefined>(undefined);

export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};

interface WindowManagerProviderProps {
  children: ReactNode;
}

export const WindowManagerProvider: React.FC<WindowManagerProviderProps> = ({ children }) => {
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [nextZIndex, setNextZIndex] = useState(10);

  // Generate random position within screen bounds
  const getRandomPosition = () => {
    const maxTop = Math.max(100, window.innerHeight - 600);
    const maxLeft = Math.max(100, window.innerWidth - 800);
    
    return {
      top: Math.random() * (maxTop - 100) + 100, // Avoid top bar
      left: Math.random() * (maxLeft - 100) + 100, // Avoid sidebar
    };
  };

  // Generate staggered position for multiple windows of same app
  const getStaggeredPosition = (appName: string) => {
    const existingWindows = windows.filter(w => w.appName === appName && w.isVisible);
    const offset = existingWindows.length * 30; // 30px offset for each new window
    
    const basePos = getRandomPosition();
    return {
      top: Math.min(basePos.top + offset, window.innerHeight - 400),
      left: Math.min(basePos.left + offset, window.innerWidth - 600),
    };
  };

  const openWindow = (appName: string, windowConfig: Omit<WindowData, 'id' | 'zIndex' | 'isVisible' | 'isMinimized' | 'appName'>) => {
    setWindows(prev => {
      // Check if window with same app name already exists and is visible
      const existingWindow = prev.find(w => w.appName === appName && w.isVisible);
      
      if (existingWindow) {
        // Bring existing window to front and restore if minimized
        setNextZIndex(current => current + 1);
        return prev.map(w => 
          w.id === existingWindow.id 
            ? { ...w, zIndex: nextZIndex, isMinimized: false }
            : w
        );
      }
      
      // Create new window with staggered position
      const position = getStaggeredPosition(appName);
      const newWindow: WindowData = {
        ...windowConfig,
        id: `${appName}-${Date.now()}`, // Unique ID
        appName,
        top: position.top,
        left: position.left,
        zIndex: nextZIndex,
        isVisible: true,
        isMinimized: false,
      };
      
      setNextZIndex(current => current + 1);
      return [...prev, newWindow];
    });
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.map(w => 
      w.id === id 
        ? { ...w, isVisible: false }
        : w
    ));
    
    // Clean up invisible windows after a delay to allow for animations
    setTimeout(() => {
      setWindows(prev => prev.filter(w => w.isVisible));
    }, 300);
  };

  const focusWindow = (id: string) => {
    setWindows(prev => 
      prev.map(w => 
        w.id === id 
          ? { ...w, zIndex: nextZIndex, isMinimized: false }
          : w
      )
    );
    setNextZIndex(current => current + 1);
  };

  const minimizeWindow = (id: string) => {
    setWindows(prev => 
      prev.map(w => 
        w.id === id 
          ? { ...w, isMinimized: true }
          : w
      )
    );
  };

  const getMaxZIndex = () => {
    return Math.max(...windows.map(w => w.zIndex), 0);
  };

  const getWindowByAppName = (appName: string) => {
    return windows.find(w => w.appName === appName && w.isVisible);
  };

  return (
    <WindowManagerContext.Provider value={{
      windows: windows.filter(w => w.isVisible), // Only return visible windows
      openWindow,
      closeWindow,
      focusWindow,
      minimizeWindow,
      getMaxZIndex,
      getWindowByAppName,
    }}>
      {children}
    </WindowManagerContext.Provider>
  );
};
