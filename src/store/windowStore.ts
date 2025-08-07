import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ReactNode } from 'react';

export interface WindowData {
  id: string;
  app: string;
  title: string;
  content: ReactNode;
  top: number;
  left: number;
  width: number;
  height: number;
  zIndex: number;
  isVisible: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  allowMultiple?: boolean; // Some apps like Terminal can have multiple instances
  
  // State preservation
  savedState?: {
    scrollPosition?: { x: number; y: number };
    formData?: Record<string, any>;
    selectedText?: string;
    cursorPosition?: number;
    customData?: Record<string, any>; // App-specific state
  };
  lastActiveTime?: number; // For tracking which window was most recently active
}

interface WindowStore {
  windows: WindowData[];
  nextZIndex: number;
  
  // Core window operations
  openWindow: (app: string, config: Omit<WindowData, 'id' | 'app' | 'zIndex' | 'isVisible' | 'isMinimized' | 'isFullscreen' | 'lastActiveTime'>) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  updateWindowState: (id: string, state: Partial<WindowData['savedState']>) => void;
  updateWindowContent: (id: string, content: React.ReactNode) => void;
  
  // Utility functions
  isAppOpen: (app: string) => boolean;
  getWindowsByApp: (app: string) => WindowData[];
  getVisibleWindows: () => WindowData[];
  
  // Position helpers
  getRandomPosition: (width?: number, height?: number) => { top: number; left: number };
  getStaggeredPosition: (app: string, width?: number, height?: number) => { top: number; left: number };
}

// Smart positioning logic
const WINDOW_STAGGER_OFFSET = 30;
const MIN_TOP = 60; // Below top bar
const MIN_LEFT = 70; // Right of sidebar

const getRandomPosition = (width: number = 600, height: number = 400): { top: number; left: number } => {
  const maxTop = Math.max(MIN_TOP + 100, window.innerHeight - height);
  const maxLeft = Math.max(MIN_LEFT + 100, window.innerWidth - width);
  
  return {
    top: Math.random() * (maxTop - MIN_TOP) + MIN_TOP,
    left: Math.random() * (maxLeft - MIN_LEFT) + MIN_LEFT,
  };
};

const getStaggeredPosition = (app: string, existingWindows: WindowData[], width: number = 600, height: number = 400): { top: number; left: number } => {
  const appWindows = existingWindows.filter(w => w.app === app && w.isVisible);
  const offset = appWindows.length * WINDOW_STAGGER_OFFSET;
  
  const basePos = getRandomPosition(width, height);
  return {
    top: Math.min(basePos.top + offset, window.innerHeight - height),
    left: Math.min(basePos.left + offset, window.innerWidth - width),
  };
};

// Apps that support multiple instances
const MULTI_INSTANCE_APPS = ['Terminal', 'Files', 'Text Editor'];

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  nextZIndex: 100,

  openWindow: (app: string, config) => {
    let returnId: string = '';
    set((state) => {
      const allowMultiple = MULTI_INSTANCE_APPS.includes(app) || config.allowMultiple;
      
      // Check if app is already open and doesn't allow multiple instances
      if (!allowMultiple) {
        const existingWindow = state.windows.find(w => w.app === app && w.isVisible);
        if (existingWindow) {
          // Bring existing window to front and restore if minimized
          const newZIndex = state.nextZIndex + 1;
          returnId = existingWindow.id;
          return {
            windows: state.windows.map(w =>
              w.id === existingWindow.id
                ? { ...w, zIndex: newZIndex, isMinimized: false }
                : w
            ),
            nextZIndex: newZIndex,
          };
        }
      }

      // Create new window
      const allVisibleWindows = state.windows.filter(w => w.isVisible);
      const position = {
        top: MIN_TOP + (allVisibleWindows.length * WINDOW_STAGGER_OFFSET),
        left: MIN_LEFT + (allVisibleWindows.length * WINDOW_STAGGER_OFFSET)
      };
      
      console.log(`🪟 Creating window at position:`, position, `(${allVisibleWindows.length} existing windows)`);
      
      const windowId = nanoid();
      returnId = windowId;
      const newWindow: WindowData = {
        ...config,
        id: windowId,
        app,
        top: position.top,
        left: position.left,
        zIndex: state.nextZIndex + 1,
        isVisible: true,
        isMinimized: false,
        isFullscreen: false,
        allowMultiple,
        lastActiveTime: Date.now(),
        savedState: {},
      };

      return {
        windows: [...state.windows, newWindow],
        nextZIndex: state.nextZIndex + 1,
      };
    });
    return returnId;
  },

  closeWindow: (id: string) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isVisible: false } : w
      ),
    }));

    // Clean up invisible windows after animation delay
    setTimeout(() => {
      set((state) => ({
        windows: state.windows.filter(w => w.isVisible),
      }));
    }, 300);
  },

  focusWindow: (id: string) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id
          ? { ...w, zIndex: state.nextZIndex + 1, isMinimized: false, lastActiveTime: Date.now() }
          : w
      ),
      nextZIndex: state.nextZIndex + 1,
    }));
  },

  minimizeWindow: (id: string) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isMinimized: true } : w
      ),
    }));
  },

  toggleFullscreen: (id: string) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, isFullscreen: !w.isFullscreen, lastActiveTime: Date.now() } : w
      ),
    }));
  },

  updateWindowState: (id: string, stateUpdate: Partial<WindowData['savedState']>) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id 
          ? { 
              ...w, 
              savedState: { ...w.savedState, ...stateUpdate },
              lastActiveTime: Date.now()
            } 
          : w
      ),
    }));
  },

  updateWindowContent: (id: string, content: React.ReactNode) => {
    set((state) => ({
      windows: state.windows.map(w =>
        w.id === id ? { ...w, content } : w
      ),
    }));
  },

  // Utility functions
  isAppOpen: (app: string) => {
    return get().windows.some(w => w.app === app && w.isVisible && !w.isMinimized);
  },

  getWindowsByApp: (app: string) => {
    return get().windows.filter(w => w.app === app && w.isVisible);
  },

  getVisibleWindows: () => {
    return get().windows.filter(w => w.isVisible);
  },

  getRandomPosition,
  getStaggeredPosition: (app: string, width?: number, height?: number) => getStaggeredPosition(app, get().windows, width, height),
}));
