import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Settings interfaces
export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  fontSize: number;
  brightness: number;
  volume: number;
  wallpaper: string;
  language: string;
  autoSave: boolean;
  soundEffects: boolean;
  animations: boolean;
  taskbarPosition: 'bottom' | 'top' | 'left' | 'right';
  iconSize: 'small' | 'medium' | 'large';
  showFileExtensions: boolean;
  doubleClickToOpen: boolean;
}

interface SettingsState {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  brightness: 80,
  volume: 50,
  wallpaper: 'default',
  language: 'en-US',
  autoSave: true,
  soundEffects: true,
  animations: true,
  taskbarPosition: 'bottom',
  iconSize: 'medium',
  showFileExtensions: true,
  doubleClickToOpen: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }));
        
        // Apply settings to DOM/CSS variables
        const newSettings = { ...get().settings, ...updates };
        applySettings(newSettings);
      },
      
      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
        applySettings(DEFAULT_SETTINGS);
      },
    }),
    {
      name: 'weave-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

// Apply settings to the DOM
function applySettings(settings: AppSettings) {
  const root = document.documentElement;
  
  // Apply theme
  if (settings.theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', settings.theme === 'dark');
  }
  
  // Apply CSS custom properties for dynamic styling
  root.style.setProperty('--font-size', `${settings.fontSize}px`);
  root.style.setProperty('--brightness', `${settings.brightness}%`);
  root.style.setProperty('--volume', `${settings.volume}%`);
  
  // Apply icon size classes
  const iconSizeMap = {
    small: '16px',
    medium: '24px',
    large: '32px'
  };
  root.style.setProperty('--icon-size', iconSizeMap[settings.iconSize]);
  
  // Apply wallpaper
  if (settings.wallpaper && settings.wallpaper !== 'default') {
    document.body.style.backgroundImage = `url(${settings.wallpaper})`;
  } else {
    document.body.style.backgroundImage = '';
  }
}

// Initialize settings on page load
if (typeof window !== 'undefined') {
  // Apply settings on store initialization
  const { settings } = useSettingsStore.getState();
  applySettings(settings);
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    const { settings } = useSettingsStore.getState();
    if (settings.theme === 'auto') {
      applySettings(settings);
    }
  });
}
