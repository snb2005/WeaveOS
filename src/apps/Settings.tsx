import React, { useState, useEffect } from 'react';
import { useWindowStore } from '../store/windowStore';
import { WallpaperManager, ThemeManager } from '../utils/wallpaperManager';
import { useTheme, getThemeClasses } from '../hooks/useTheme';
import { useSettingsStore, type AppSettings } from '../stores/settingsStore';

interface SettingsProps {
  windowId?: string;
}

interface SettingsCategory {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<{ settings: AppSettings; updateSettings: (updates: Partial<AppSettings>) => void }>;
}

// Appearance Settings Component
const AppearanceSettings = ({ settings, updateSettings }: { settings: AppSettings; updateSettings: (updates: Partial<AppSettings>) => void }) => {
  const [customWallpapers, setCustomWallpapers] = useState<Array<{id: string, name: string, url: string}>>([]);

  // Load custom wallpapers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('weave-custom-wallpapers');
    if (saved) {
      setCustomWallpapers(JSON.parse(saved));
    }
  }, []);

  // Save custom wallpapers to localStorage
  const saveCustomWallpapers = (wallpapers: Array<{id: string, name: string, url: string}>) => {
    setCustomWallpapers(wallpapers);
    localStorage.setItem('weave-custom-wallpapers', JSON.stringify(wallpapers));
  };

  // Handle file upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, etc.)');
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newWallpaper = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        url: imageUrl
      };

      const updatedWallpapers = [...customWallpapers, newWallpaper];
      saveCustomWallpapers(updatedWallpapers);
    };
    reader.readAsDataURL(file);
  };

  // Remove custom wallpaper
  const removeCustomWallpaper = (id: string) => {
    const updatedWallpapers = customWallpapers.filter(w => w.id !== id);
    saveCustomWallpapers(updatedWallpapers);
    
    // If the removed wallpaper was currently selected, switch to default
    if (settings.wallpaper === id) {
      updateSettings({ wallpaper: 'default' });
      const wallpaperManager = WallpaperManager.getInstance();
      wallpaperManager.setWallpaper('default');
    }
  };

  const themes = [
    { id: 'dark', name: 'Dark', preview: 'bg-gradient-to-br from-gray-900 to-gray-800' },
    { id: 'light', name: 'Light', preview: 'bg-gradient-to-br from-blue-50 to-white' },
    { id: 'auto', name: 'Auto (System)', preview: 'bg-gradient-to-br from-gray-600 to-blue-300' }
  ];

  const wallpapers = [
    { id: 'default', name: 'Default', preview: 'bg-gray-800', imageUrl: '/images/default.jpg' },
    { id: 'live', name: 'Live Wallpaper', preview: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' }
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
        <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
          🎨 Theme
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => {
                updateSettings({ theme: theme.id as any });
                // Apply theme using ThemeManager
                const themeManager = ThemeManager.getInstance();
                themeManager.setTheme(theme.id);
              }}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                settings.theme === theme.id
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-zinc-600/50 hover:border-white/40'
              }`}
            >
              <div className={`w-full h-16 rounded-lg mb-3 ${theme.preview}`}></div>
              <div className="text-sm text-theme-primary font-medium">{theme.name}</div>
              {settings.theme === theme.id && (
                <div className="absolute top-2 right-2 text-blue-400">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Wallpaper Selection */}
      <div>
        <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
          🖼️ Wallpaper
        </h3>
        
        {/* Default Wallpapers */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {wallpapers.map(wallpaper => (
            <button
              key={wallpaper.id}
              onClick={() => {
                updateSettings({ wallpaper: wallpaper.id });
                // Apply wallpaper using WallpaperManager
                const wallpaperManager = WallpaperManager.getInstance();
                wallpaperManager.setWallpaper(wallpaper.id);
              }}
              className={`relative p-3 rounded-lg border-2 transition-all ${
                settings.wallpaper === wallpaper.id
                  ? 'border-blue-400 bg-blue-500/20'
                  : 'border-zinc-600/50 hover:border-white/40'
              }`}
            >
              <div className={`w-full h-12 rounded ${
                wallpaper.id === 'default' 
                  ? 'bg-cover bg-center' 
                  : wallpaper.id === 'live' 
                    ? `${wallpaper.preview} animate-pulse` 
                    : wallpaper.preview
                }`}
                style={wallpaper.id === 'default' ? { backgroundImage: `url(${wallpaper.imageUrl})` } : {}}
              >
                {wallpaper.id === 'live' && (
                  <div className="flex items-center justify-center h-full text-theme-primary text-xs font-bold">
                    LIVE
                  </div>
                )}
              </div>
              <div className="text-xs text-theme-primary mt-2">{wallpaper.name}</div>
              {settings.wallpaper === wallpaper.id && (
                <div className="absolute top-1 right-1 text-blue-400 text-xs">✓</div>
              )}
            </button>
          ))}
        </div>

        {/* Upload Custom Wallpaper */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-theme-secondary mb-3 flex items-center gap-2">
            📁 Upload Custom Wallpaper
          </h4>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-600/50 border-dashed rounded-lg cursor-pointer bg-zinc-800/30 hover:bg-zinc-700/30 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-4 text-theme-secondary" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
              </svg>
              <p className="mb-2 text-sm text-theme-secondary">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-theme-secondary">PNG, JPG, GIF (MAX 10MB)</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        {/* Custom Wallpapers */}
        {customWallpapers.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-theme-secondary mb-3 flex items-center gap-2">
              🎨 Custom Wallpapers
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {customWallpapers.map(wallpaper => (
                <div key={wallpaper.id} className="relative">
                  <button
                    onClick={() => {
                      updateSettings({ wallpaper: wallpaper.id });
                      // Apply custom wallpaper using WallpaperManager
                      const wallpaperManager = WallpaperManager.getInstance();
                      wallpaperManager.setCustomWallpaper(wallpaper.url);
                    }}
                    className={`relative p-3 rounded-lg border-2 transition-all w-full ${
                      settings.wallpaper === wallpaper.id
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-zinc-600/50 hover:border-white/40'
                    }`}
                  >
                    <div 
                      className="w-full h-12 rounded bg-cover bg-center"
                      style={{ backgroundImage: `url(${wallpaper.url})` }}
                    ></div>
                    <div className="text-xs text-theme-primary mt-2 truncate">{wallpaper.name}</div>
                    {settings.wallpaper === wallpaper.id && (
                      <div className="absolute top-1 right-1 text-blue-400 text-xs">✓</div>
                    )}
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCustomWallpaper(wallpaper.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                    title="Remove wallpaper"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {settings.wallpaper === 'live' && (
          <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
            <div className="text-sm text-blue-300 flex items-center gap-2">
              <span className="animate-pulse">🔄</span>
              Live wallpaper is active - images change every 10 seconds
            </div>
          </div>
        )}
      </div>

      {/* Brightness Control */}
      <div>
        <h3 className="text-lg font-semibold text-theme-primary mb-4 flex items-center gap-2">
          ☀️ Brightness
        </h3>
        <div className="bg-theme-tertiary rounded-xl p-4">
          <div className="flex items-center gap-4">
            <span className="text-2xl">🌙</span>
            <input
              type="range"
              min="10"
              max="100"
              value={settings.brightness}
              onChange={(e) => {
                const brightness = parseInt(e.target.value);
                updateSettings({ brightness });
                // Apply brightness filter to the entire app
                document.documentElement.style.filter = `brightness(${brightness}%)`;
              }}
              className="flex-1 h-3 bg-zinc-700/50 rounded-lg appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-blue-500 
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
            />
            <span className="text-2xl">☀️</span>
            <div className="text-theme-primary font-medium w-12 text-center">{settings.brightness}%</div>
          </div>
          <div className="mt-2 text-xs text-theme-secondary">
            Controls the overall screen brightness
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
              onChange={(e) => {
                const fontSize = parseInt(e.target.value);
                updateSettings({ fontSize });
                // Apply font size globally
                document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
                document.body.style.fontSize = `${fontSize}px`;
              }}
              className="flex-1 h-3 bg-zinc-700/50 rounded-lg appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-purple-500 
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
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
              onChange={(e) => {
                const volume = parseInt(e.target.value);
                updateSettings({ volume });
                // Store volume globally for web audio contexts
                if (typeof window !== 'undefined') {
                  (window as any).weaveVolume = volume / 100;
                }
              }}
              className="flex-1 h-3 bg-zinc-700/50 rounded-lg appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:bg-green-500 
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
            />
            <span className="text-2xl">🔊</span>
            <div className="text-white font-medium w-12 text-center">{settings.volume}%</div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Controls system volume for audio playback
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
  const { isLight } = useTheme();
  const theme = getThemeClasses(isLight);
  const { settings, updateSettings } = useSettingsStore();
  
  // Find current window state
  const currentWindow = windows.find(w => w.id === windowId);
  const settingsState = currentWindow?.savedState?.customData?.settings as any;
  
  const [activeCategory, setActiveCategory] = useState(settingsState?.activeCategory || 'appearance');

  // Save state to window store whenever important state changes
  useEffect(() => {
    if (windowId) {
      updateWindowState(windowId, {
        customData: {
          settings: {
            activeCategory
          }
        }
      });
    }
  }, [windowId, activeCategory, updateWindowState]);

  const categories: SettingsCategory[] = [
    { id: 'appearance', name: 'Appearance', icon: '🎨', component: AppearanceSettings },
    { id: 'system', name: 'System', icon: '⚙️', component: SystemSettings },
    { id: 'files', name: 'Files', icon: '📁', component: FilesSettings },
    { id: 'about', name: 'About', icon: 'ℹ️', component: AboutSettings }
  ];

  const ActiveComponent = categories.find(cat => cat.id === activeCategory)?.component || AppearanceSettings;

  return (
    <div className={`w-full h-full ${theme.bgPrimary} rounded-xl border ${theme.border} flex overflow-hidden`}>
      {/* Sidebar */}
      <div className={`w-64 ${theme.bgSecondary} border-r ${theme.border} flex flex-col`}>
        <div className={`p-6 border-b ${theme.border}`}>
          <h1 className={`text-xl font-bold ${theme.textPrimary} flex items-center gap-2`}>
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
                    : `${theme.textSecondary} hover:${theme.textPrimary} ${theme.bgHover}`
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className={`p-4 border-t ${theme.border}`}>
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
        <div className={`p-6 border-b ${theme.border}`}>
          <h2 className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-3`}>
            <span className="text-3xl">
              {categories.find(cat => cat.id === activeCategory)?.icon}
            </span>
            {categories.find(cat => cat.id === activeCategory)?.name}
          </h2>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {React.createElement(ActiveComponent, { settings, updateSettings })}
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
