// App configuration interface
export interface AppConfig {
  id: string;
  name: string;
  icon: string;
  allowMultiple: boolean;
  width: number;
  height: number;
  description?: string;
}

// Central App Registry Configuration
export const APP_REGISTRY: Record<string, AppConfig> = {
  Terminal: {
    id: 'Terminal',
    name: 'Terminal',
    icon: '🖥️',
    allowMultiple: true,
    width: 700,
    height: 500,
    description: 'Command line interface with xterm.js',
  },
  
  Files: {
    id: 'Files',
    name: 'Files',
    icon: '📁',
    allowMultiple: true,
    width: 800,
    height: 600,
    description: 'File manager with virtual file system',
  },
  
  Calculator: {
    id: 'Calculator',
    name: 'Calculator',
    icon: '🧮',
    allowMultiple: false,
    width: 350,
    height: 500,
    description: 'Basic calculator application',
  },
  
  Settings: {
    id: 'Settings',
    name: 'Settings',
    icon: '⚙️',
    allowMultiple: false,
    width: 900,
    height: 650,
    description: 'System settings and preferences',
  },
  
  Browser: {
    id: 'Browser',
    name: 'Browser',
    icon: '🌐',
    allowMultiple: true,
    width: 1200,
    height: 800,
    description: 'Full-featured web browser with tabs, bookmarks, and navigation',
  },
  
  TextEditor: {
    id: 'TextEditor',
    name: 'Text Editor',
    icon: '📝',
    allowMultiple: true,
    width: 800,
    height: 600,
    description: 'Text editor with syntax highlighting support',
  },
  
  MediaPlayer: {
    id: 'Media Player',
    name: 'Media Player',
    icon: '🎵',
    allowMultiple: false,
    width: 600,
    height: 500,
    description: 'Audio and video media player',
  },
  
  IconDemo: {
    id: 'IconDemo',
    name: 'Icon Gallery',
    icon: '🎨',
    allowMultiple: false,
    width: 900,
    height: 700,
    description: 'Showcase of Papirus Ubuntu icons',
  },
};

// Helper functions for working with the registry
export const getAppConfig = (appName: string): AppConfig | undefined => {
  return APP_REGISTRY[appName];
};

export const getAllAppConfigs = (): AppConfig[] => {
  return Object.values(APP_REGISTRY);
};

export const getMultiInstanceApps = (): AppConfig[] => {
  return getAllAppConfigs().filter(app => app.allowMultiple);
};

export const getSingleInstanceApps = (): AppConfig[] => {
  return getAllAppConfigs().filter(app => !app.allowMultiple);
};

// Apps that appear in the dock (main applications)
export const DOCK_APPS = [
  'Terminal',
  'Files',
  'Firefox',
  'Text Editor',
  'Calculator',
  'Media Player',
  'Settings',
];

export default APP_REGISTRY;
