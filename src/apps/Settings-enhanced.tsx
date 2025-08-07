import { useState, useEffect } from 'react';
import { useWindowStore } from '../store/windowStore';

interface SettingsProps {
  windowId?: string;
}

// Settings interfaces
interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  fontSize: number;
  brightness: number;
  volume: number;
  wallpaper: string;
  language: string;
  timezone: string;
  autoSave: boolean;
  notifications: boolean;
  soundEffects: boolean;
  animations: boolean;
  taskbarPosition: 'bottom' | 'top' | 'left' | 'right';
  iconSize: 'small' | 'medium' | 'large';
  showFileExtensions: boolean;
  doubleClickToOpen: boolean;
  startupApps: string[];
}

interface SettingsCategory {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<{ settings: AppSettings; updateSettings: (updates: Partial<AppSettings>) => void }>;
}

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  brightness: 80,
  volume: 50,
  wallpaper: 'gradient-blue',
  language: 'en-US',
  timezone: 'UTC',
  autoSave: true,
  notifications: true,
  soundEffects: true,
  animations: true,
  taskbarPosition: 'bottom',
  iconSize: 'medium',
  showFileExtensions: true,
  doubleClickToOpen: true,
  startupApps: []
};

// Appearance Settings Component
const AppearanceSettings = ({ settings, updateSettings }: { settings: AppSettings; updateSettings: (updates: Partial<AppSettings>) => void }) => {
  const themes = [
    { id: 'dark', name: 'Dark', preview: 'bg-gradient-to-br from-gray-900 to-gray-800' },
    { id: 'light', name: 'Light', preview: 'bg-gradient-to-br from-blue-50 to-white' },
    { id: 'auto', name: 'Auto (System)', preview: 'bg-gradient-to-br from-gray-600 to-blue-300' }
  ];

  const wallpapers = [
    { id: 'gradient-blue', name: 'Ocean Gradient', preview: 'bg-gradient-to-br from-blue-600 to-purple-700' },
    { id: 'gradient-sunset', name: 'Sunset Gradient', preview: 'bg-gradient-to-br from-orange-400 to-red-600' },
    { id: 'gradient-forest', name: 'Forest Gradient', preview: 'bg-gradient-to-br from-green-600 to-teal-700' },
    { id: 'gradient-space', name: 'Space Gradient', preview: 'bg-gradient-to-br from-purple-900 to-black' }
  ];

  const iconSizes = [
    { id: 'small', name: 'Small (24px)', size: '24px' },
    { id: 'medium', name: 'Medium (32px)', size: '32px' },
    { id: 'large', name: 'Large (48px)', size: '48px' }
  ];

  return (
    <div className="space-y-8">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          🎨 Theme
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => updateSettings({ theme: theme.id as any })}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                settings.theme === theme.id
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-zinc-600/50 hover:border-white/40'
              }`}
            >
              <div className={`w-full h-16 rounded-lg mb-3 ${theme.preview}`}></div>
              <div className="text-sm text-white font-medium">{theme.name}</div>
              {settings.theme === theme.id && (
                <div className="absolute top-2 right-2 text-blue-400">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Wallpaper Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          🖼️ Wallpaper
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {wallpapers.map(wallpaper => (
            <button
              key={wallpaper.id}
              onClick={() => updateSettings({ wallpaper: wallpaper.id })}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                settings.wallpaper === wallpaper.id
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-zinc-600/50 hover:border-white/40'
              }`}
            >
              <div className={`w-full h-12 rounded ${wallpaper.preview}`}></div>
              <div className="text-xs text-white mt-2">{wallpaper.name}</div>
              {settings.wallpaper === wallpaper.id && (
                <div className="absolute top-1 right-1 text-blue-400 text-xs">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Brightness Control */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          ☀️ Brightness
        </h3>
        <div className="bg-zinc-800/50 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🌙</span>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.brightness}
              onChange={(e) => updateSettings({ brightness: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-zinc-700/50 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-2xl">☀️</span>
            <div className="text-white font-medium w-12 text-center">{settings.brightness}%</div>
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          🔤 Font Size
        </h3>
        <div className="bg-zinc-800/50 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm">A</span>
            <input
              type="range"
              min="10"
              max="24"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-zinc-700/50 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-xl">A</span>
            <div className="text-white font-medium w-12 text-center">{settings.fontSize}px</div>
          </div>
          <div className="mt-3 text-gray-400" style={{ fontSize: settings.fontSize }}>
            Sample text with current font size
          </div>
        </div>
      </div>

      {/* Icon Size */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          📐 Icon Size
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {iconSizes.map(size => (
            <button
              key={size.id}
              onClick={() => updateSettings({ iconSize: size.id as any })}
              className={`p-4 rounded-xl border-2 transition-all ${
                settings.iconSize === size.id
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-zinc-600/50 hover:border-white/40'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="bg-blue-500 rounded" style={{ width: size.size, height: size.size }}></div>
              </div>
              <div className="text-sm text-white">{size.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// System Settings Component
const SystemSettings = ({ settings, updateSettings }: { settings: AppSettings; updateSettings: (updates: Partial<AppSettings>) => void }) => {
  const languages = [
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
    { code: 'de-DE', name: 'German', flag: '🇩🇪' },
    { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' }
  ];

  const taskbarPositions = [
    { id: 'bottom', name: 'Bottom', icon: '⬇️' },
    { id: 'top', name: 'Top', icon: '⬆️' },
    { id: 'left', name: 'Left', icon: '⬅️' },
    { id: 'right', name: 'Right', icon: '➡️' }
  ];

  return (
    <div className="space-y-8">
      {/* Volume Control */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          🔊 Volume
        </h3>
        <div className="bg-zinc-800/50 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🔇</span>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={(e) => updateSettings({ volume: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-zinc-700/50 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-2xl">🔊</span>
            <div className="text-white font-medium w-12 text-center">{settings.volume}%</div>
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          🌐 Language
        </h3>
        <select
          value={settings.language}
          onChange={(e) => updateSettings({ language: e.target.value })}
          className="w-full bg-zinc-800/50 border border-zinc-600/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code} className="bg-zinc-800">
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Taskbar Position */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          📍 Taskbar Position
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {taskbarPositions.map(position => (
            <button
              key={position.id}
              onClick={() => updateSettings({ taskbarPosition: position.id as any })}
              className={`p-4 rounded-xl border-2 transition-all ${
                settings.taskbarPosition === position.id
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-zinc-600/50 hover:border-white/40'
              }`}
            >
              <div className="text-2xl mb-2">{position.icon}</div>
              <div className="text-sm text-white">{position.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* System Preferences */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          ⚙️ Preferences
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <div className="text-white font-medium">Notifications</div>
                <div className="text-gray-400 text-sm">Show system notifications</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => updateSettings({ notifications: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-600/50 bg-zinc-700/50 text-blue-500 focus:ring-blue-400"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔊</span>
              <div>
                <div className="text-white font-medium">Sound Effects</div>
                <div className="text-gray-400 text-sm">Play system sounds</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.soundEffects}
              onChange={(e) => updateSettings({ soundEffects: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-600/50 bg-zinc-700/50 text-blue-500 focus:ring-blue-400"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">✨</span>
              <div>
                <div className="text-white font-medium">Animations</div>
                <div className="text-gray-400 text-sm">Enable UI animations</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.animations}
              onChange={(e) => updateSettings({ animations: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-600/50 bg-zinc-700/50 text-blue-500 focus:ring-blue-400"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">💾</span>
              <div>
                <div className="text-white font-medium">Auto Save</div>
                <div className="text-gray-400 text-sm">Automatically save changes</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => updateSettings({ autoSave: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-600/50 bg-zinc-700/50 text-blue-500 focus:ring-blue-400"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

// Files Settings Component
const FilesSettings = ({ settings, updateSettings }: { settings: AppSettings; updateSettings: (updates: Partial<AppSettings>) => void }) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          📁 File Manager
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">📄</span>
              <div>
                <div className="text-white font-medium">Show File Extensions</div>
                <div className="text-gray-400 text-sm">Display file extensions like .txt, .jpg</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.showFileExtensions}
              onChange={(e) => updateSettings({ showFileExtensions: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-600/50 bg-zinc-700/50 text-blue-500 focus:ring-blue-400"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-700/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-xl">👆</span>
              <div>
                <div className="text-white font-medium">Double-click to Open</div>
                <div className="text-gray-400 text-sm">Require double-click to open files</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.doubleClickToOpen}
              onChange={(e) => updateSettings({ doubleClickToOpen: e.target.checked })}
              className="w-5 h-5 rounded border-zinc-600/50 bg-zinc-700/50 text-blue-500 focus:ring-blue-400"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

// About Component
const AboutSettings = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="text-6xl mb-4">🌐</div>
        <h2 className="text-2xl font-bold text-white mb-2">Weave OS</h2>
        <p className="text-gray-400 mb-6">Version 1.0.0</p>
      </div>

      <div className="bg-zinc-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Operating System:</span>
            <span className="text-white">Weave OS 1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Platform:</span>
            <span className="text-white">Web Browser</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Architecture:</span>
            <span className="text-white">JavaScript/TypeScript</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Framework:</span>
            <span className="text-white">React + Vite</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Memory:</span>
            <span className="text-white">Browser Managed</span>
          </div>
        </div>
      </div>

      <div className="bg-zinc-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">File Management</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">Text Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">Web Browser</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">Media Player</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-gray-400">Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings = ({ windowId }: SettingsProps = {}) => {
  const { updateWindowState, windows } = useWindowStore();
  
  // Find current window state
  const currentWindow = windows.find(w => w.id === windowId);
  const settingsState = currentWindow?.savedState?.customData?.settings as any;
  
  const [activeCategory, setActiveCategory] = useState(settingsState?.activeCategory || 'appearance');
  const [settings, setSettings] = useState<AppSettings>({ 
    ...DEFAULT_SETTINGS, 
    ...settingsState?.currentSettings 
  });

  // Save state to window store whenever important state changes
  useEffect(() => {
    if (windowId) {
      updateWindowState(windowId, {
        customData: {
          settings: {
            activeCategory,
            currentSettings: settings
          }
        }
      });
    }
  }, [windowId, activeCategory, settings, updateWindowState]);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('weave-os-settings');
    if (savedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
    }
  }, []);

  // Save settings to localStorage when changed
  const updateSettings = (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('weave-os-settings', JSON.stringify(newSettings));
    
    // Apply settings immediately where possible
    if (updates.brightness !== undefined) {
      document.documentElement.style.setProperty('--brightness', `${updates.brightness}%`);
    }
    if (updates.fontSize !== undefined) {
      document.documentElement.style.setProperty('--font-size', `${updates.fontSize}px`);
    }
  };

  const categories: SettingsCategory[] = [
    { id: 'appearance', name: 'Appearance', icon: '🎨', component: AppearanceSettings },
    { id: 'system', name: 'System', icon: '⚙️', component: SystemSettings },
    { id: 'files', name: 'Files', icon: '📁', component: FilesSettings },
    { id: 'about', name: 'About', icon: 'ℹ️', component: AboutSettings }
  ];

  const ActiveComponent = categories.find(cat => cat.id === activeCategory)?.component || AppearanceSettings;

  return (
    <div className="w-full h-full bg-zinc-900 rounded-xl border border-zinc-700/50 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-800/80 border-r border-zinc-700/50 flex flex-col">
        <div className="p-6 border-b border-zinc-700/50">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            ⚙️ Settings
          </h1>
        </div>
        
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                  activeCategory === category.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                    : 'text-gray-300 hover:text-white hover:bg-zinc-700/50'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-zinc-700/50">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800/50 transition-all">
              <span>🔄</span>
              <span className="text-sm">Reset Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800/50 transition-all">
              <span>📥</span>
              <span className="text-sm">Import Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800/50 transition-all">
              <span>📤</span>
              <span className="text-sm">Export Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">
              {categories.find(cat => cat.id === activeCategory)?.icon}
            </span>
            {categories.find(cat => cat.id === activeCategory)?.name}
          </h2>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <ActiveComponent settings={settings} updateSettings={updateSettings} />
        </div>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default Settings;
