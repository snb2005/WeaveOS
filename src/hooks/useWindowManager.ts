import { useCallback } from 'react';
import { useWindowStore } from '../store/windowStore';
import type { WindowData } from '../store/windowStore';
import type { ReactNode } from 'react';

// App configuration interface
export interface AppConfig {
  title: string;
  content: ReactNode;
  width: number;
  height: number;
  allowMultiple?: boolean;
}

// Custom hook for window management with cleaner API
export const useWindowManager = () => {
  const {
    openWindow: storeOpenWindow,
    closeWindow: storeCloseWindow,
    focusWindow: storeFocusWindow,
    minimizeWindow: storeMinimizeWindow,
    toggleFullscreen: storeToggleFullscreen,
    isAppOpen,
    getWindowsByApp,
    getVisibleWindows,
  } = useWindowStore();

  // Memoized window operations
  const openWindow = useCallback((app: string, config: AppConfig): string => {
    return storeOpenWindow(app, {
      title: config.title,
      content: config.content,
      width: config.width,
      height: config.height,
      top: 0, // Will be overridden by smart positioning
      left: 0, // Will be overridden by smart positioning
      allowMultiple: config.allowMultiple,
    });
  }, [storeOpenWindow]);

  const closeWindow = useCallback((id: string) => {
    storeCloseWindow(id);
  }, [storeCloseWindow]);

  const focusWindow = useCallback((id: string) => {
    storeFocusWindow(id);
  }, [storeFocusWindow]);

  const minimizeWindow = useCallback((id: string) => {
    storeMinimizeWindow(id);
  }, [storeMinimizeWindow]);

  const toggleFullscreen = useCallback((id: string) => {
    storeToggleFullscreen(id);
  }, [storeToggleFullscreen]);

  // Enhanced utility functions
  const getAppWindowCount = useCallback((app: string): number => {
    return getWindowsByApp(app).length;
  }, [getWindowsByApp]);

  const hasVisibleWindows = useCallback((): boolean => {
    return getVisibleWindows().length > 0;
  }, [getVisibleWindows]);

  const getTopWindow = useCallback((): WindowData | null => {
    const visibleWindows = getVisibleWindows();
    if (visibleWindows.length === 0) return null;
    
    return visibleWindows.reduce((top, current) => 
      current.zIndex > top.zIndex ? current : top
    );
  }, [getVisibleWindows]);

  return {
    // State
    windows: getVisibleWindows(),
    
    // Core operations
    openWindow,
    closeWindow,
    focusWindow,
    minimizeWindow,
    toggleFullscreen,
    
    // Utility functions
    isAppOpen,
    getAppWindowCount,
    hasVisibleWindows,
    getTopWindow,
    getWindowsByApp,
  };
};
