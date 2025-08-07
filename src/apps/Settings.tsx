import { useState, useEffect } from 'react';

// Theme options
interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  preview: string;
}

// Wallpaper options
interface Wallpaper {
  id: string;
  name: string;
  style: string;
  preview: string;
}

const THEMES: Theme[] = [
  { 
    id: 'dark', 
    name: 'Dark', 
    primary: '#1f2937', 
    secondary: '#374151', 
    background: 'from-slate-800 via-slate-700 to-slate-900',
    preview: 'bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900'
  },
  { 
    id: 'light', 
    name: 'Light', 
    primary: '#f3f4f6', 
    secondary: '#e5e7eb', 
    background: 'from-blue-50 via-white to-blue-100',
    preview: 'bg-gradient-to-br from-blue-50 via-white to-blue-100'
  },
  { 
    id: 'blue', 
    name: 'Ocean Blue', 
    primary: '#1e40af', 
    secondary: '#3b82f6', 
    background: 'from-blue-900 via-blue-800 to-blue-700',
    preview: 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700'
  },
  { 
    id: 'purple', 
    name: 'Purple Night', 
    primary: '#7c3aed', 
    secondary: '#8b5cf6', 
    background: 'from-purple-900 via-purple-800 to-purple-700',
    preview: 'bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700'
  },
  { 
    id: 'green', 
    name: 'Forest Green', 
    primary: '#059669', 
    secondary: '#10b981', 
    background: 'from-emerald-900 via-emerald-800 to-emerald-700',
    preview: 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700'
  },
];

// Wallpaper options
interface Wallpaper {
  id: string;
  name: string;
  style: string;
  preview: string;
}

const WALLPAPERS: Wallpaper[] = [
  { id: 'custom', name: 'macOS Custom', style: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', preview: 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700' },
  { id: 'time-based', name: 'Time-Based Auto', style: 'dynamic', preview: 'bg-gradient-to-br from-orange-400 via-blue-500 to-purple-600' },
  { id: 'monterey', name: 'macOS Monterey', style: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', preview: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' },
  { id: 'bigsur', name: 'macOS Big Sur', style: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', preview: 'bg-gradient-to-br from-cyan-300 via-blue-300 to-pink-300' },
  { id: 'catalina', name: 'macOS Catalina', style: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', preview: 'bg-gradient-to-br from-pink-300 via-purple-300 to-yellow-200' },
  { id: 'dark', name: 'Dark Theme', style: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', preview: 'bg-gradient-to-br from-gray-800 to-gray-900' },
  { id: 'light', name: 'Light Theme', style: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', preview: 'bg-gradient-to-br from-gray-50 to-gray-200' },
];

// Settings state management
interface SystemSettings {
  theme: string;
  wallpaper: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoSave: boolean;
  darkMode: boolean;
  fontSize: number;
  brightness: number;
  animationsEnabled: boolean;
  dockAutoHide: boolean;
  hotCorners: boolean;
  windowShadows: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  theme: 'dark',
  wallpaper: 'time-based',
  soundEnabled: true,
  notificationsEnabled: true,
  autoSave: true,
  darkMode: true,
  fontSize: 14,
  brightness: 80,
  animationsEnabled: true,
  dockAutoHide: false,
  hotCorners: false,
  windowShadows: true,
};

// Load settings from localStorage
const loadSettings = (): SystemSettings => {
  try {
    const saved = localStorage.getItem('weave-os-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

// Save settings to localStorage
const saveSettings = (settings: SystemSettings) => {
  try {
    localStorage.setItem('weave-os-settings', JSON.stringify(settings));
    // Dispatch custom event for theme changes
    window.dispatchEvent(new CustomEvent('weave-settings-changed', { detail: settings }));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

// Settings categories and their content
interface SettingCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const SETTING_CATEGORIES: SettingCategory[] = [
  { id: 'appearance', name: 'Appearance', icon: '🎨', description: 'Themes, wallpapers, and customization' },
  { id: 'system', name: 'System', icon: '⚙️', description: 'General system preferences' },
  { id: 'display', name: 'Display', icon: '🖥️', description: 'Screen resolution and display settings' },
  { id: 'about', name: 'About', icon: 'ℹ️', description: 'System information and version' },
];

// Toggle Switch Component
const ToggleSwitch = ({ label, enabled, onChange, description }: {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  description?: string;
}) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <div className="font-medium text-gray-900">{label}</div>
      {description && <div className="text-sm text-gray-500">{description}</div>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

// Slider Component  
const Slider = ({ label, value, onChange, min = 0, max = 100, unit = '' }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) => (
  <div className="py-3">
    <div className="flex justify-between items-center mb-2">
      <div className="font-medium text-gray-900">{label}</div>
      <div className="text-sm text-gray-500">{value}{unit}</div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
    />
  </div>
);

const Settings = () => {
  const [activeCategory, setActiveCategory] = useState('appearance');
  const [settings, setSettings] = useState<SystemSettings>(loadSettings);

  // Save settings whenever they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Selection</h3>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => updateSetting('theme', theme.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                settings.theme === theme.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-full h-16 rounded-md mb-2 ${theme.preview}`}></div>
              <div className="text-sm font-medium text-gray-900">{theme.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallpaper Selection</h3>
        <div className="grid grid-cols-3 gap-2">
          {WALLPAPERS.map((wallpaper) => (
            <button
              key={wallpaper.id}
              onClick={() => updateSetting('wallpaper', wallpaper.id)}
              className={`p-2 rounded-lg border-2 transition-all ${
                settings.wallpaper === wallpaper.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-full h-12 rounded-md mb-1 ${wallpaper.preview}`}></div>
              <div className="text-xs text-gray-700">{wallpaper.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interface</h3>
        <Slider
          label="Font Size"
          value={settings.fontSize}
          onChange={(value) => updateSetting('fontSize', value)}
          min={10}
          max={20}
          unit="px"
        />
        <ToggleSwitch
          label="Dark Mode"
          enabled={settings.darkMode}
          onChange={(enabled) => updateSetting('darkMode', enabled)}
          description="Use dark theme for the interface"
        />
        <ToggleSwitch
          label="Animations"
          enabled={settings.animationsEnabled}
          onChange={(enabled) => updateSetting('animationsEnabled', enabled)}
          description="Enable window animations and transitions"
        />
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General</h3>
        <ToggleSwitch
          label="Sound Effects"
          enabled={settings.soundEnabled}
          onChange={(enabled) => updateSetting('soundEnabled', enabled)}
          description="Play sound effects for system events"
        />
        <ToggleSwitch
          label="Notifications"
          enabled={settings.notificationsEnabled}
          onChange={(enabled) => updateSetting('notificationsEnabled', enabled)}
          description="Show desktop notifications"
        />
        <ToggleSwitch
          label="Auto Save"
          enabled={settings.autoSave}
          onChange={(enabled) => updateSetting('autoSave', enabled)}
          description="Automatically save your work"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Local Storage Used</span>
            <span className="text-sm font-medium">2.1 MB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '15%' }}></div>
          </div>
          <button 
            className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            onClick={() => {
              if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                localStorage.clear();
                location.reload();
              }
            }}
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Screen</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Current Resolution</div>
          <div className="text-lg font-medium">{window.screen.width} × {window.screen.height}</div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Window Management</h3>
        <ToggleSwitch
          label="Snap Windows"
          enabled={true}
          onChange={() => {}}
          description="Automatically snap windows to screen edges"
        />
        <ToggleSwitch
          label="Window Shadows"
          enabled={true}
          onChange={() => {}}
          description="Show shadows around windows"
        />
      </div>
    </div>
  );

  const renderAboutSettings = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🌊</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Weave OS</h2>
        <p className="text-gray-600">Version 1.0.0</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">System Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Platform:</span>
              <span>Web Browser</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">User Agent:</span>
              <span className="truncate ml-4">{navigator.userAgent.split(' ')[0]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Language:</span>
              <span>{navigator.language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Online:</span>
              <span>{navigator.onLine ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Virtual File System with persistent storage</li>
            <li>• Multi-window interface with drag & resize</li>
            <li>• Terminal with Unix-like commands</li>
            <li>• File manager with context menus</li>
            <li>• Text editor with syntax highlighting</li>
            <li>• Responsive design for all devices</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'appearance':
        return renderAppearanceSettings();
      case 'system':
        return renderSystemSettings();
      case 'display':
        return renderDisplaySettings();
      case 'about':
        return renderAboutSettings();
      default:
        return renderAppearanceSettings();
    }
  };

  return (
    <div className="h-full flex bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
        <nav className="space-y-1">
          {SETTING_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                activeCategory === category.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{category.icon}</span>
                <div>
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs text-gray-500">{category.description}</div>
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
