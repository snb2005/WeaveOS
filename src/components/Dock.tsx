import React from 'react';
import { useWindowStore } from '../store/windowStore';
import { DOCK_APPS, getAppConfig } from '../registry/appRegistry';
import { useSettingsStore } from '../stores/settingsStore';

interface DockProps {
  onAppClick?: (appName: string) => void;
}

const Dock: React.FC<DockProps> = ({ onAppClick }) => {
  const { isAppOpen } = useWindowStore();
  const { settings } = useSettingsStore();
  
  // Calculate icon size based on settings
  const getIconSize = () => {
    switch (settings.iconSize) {
      case 'small': return 'w-8 h-8';
      case 'large': return 'w-16 h-16';
      default: return 'w-12 h-12'; // medium
    }
  };
  
  // Get dock apps from registry
  const apps = DOCK_APPS.map(appName => {
    const config = getAppConfig(appName);
    return {
      name: appName,
      icon: config?.icon || '❓',
      id: appName.toLowerCase().replace(/\s+/g, '-'),
    };
  }).filter(app => app);

  const handleAppClick = (appName: string) => {
    if (onAppClick) {
      onAppClick(appName);
    }
    console.log(`Launching ${appName}...`);
  };

  return (
    <div className="fixed left-0 top-8 bottom-0 w-14 bg-gray-800 bg-opacity-95 z-40 flex flex-col items-center py-3 border-r border-gray-700">
      {/* Ubuntu logo/dash button */}
      <div className="w-10 h-10 mb-3 rounded-sm bg-orange-500 hover:bg-orange-400 transition-colors flex items-center justify-center cursor-pointer group">
        <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
          <div className="grid grid-cols-3 gap-px">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-1 h-1 bg-orange-500 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>

      {/* App icons */}
      <div className="flex flex-col space-y-2 flex-1">
        {apps.map((app) => {
          const appIsOpen = isAppOpen(app.name);
          
          return (
            <div
              key={app.id}
              className={`${getIconSize()} rounded-sm bg-gray-700 bg-opacity-0 hover:bg-opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer group relative`}
              onClick={() => handleAppClick(app.name)}
              title={app.name}
            >
              <span className={`${settings.iconSize === 'small' ? 'text-sm' : settings.iconSize === 'large' ? 'text-2xl' : 'text-lg'}`}>{app.icon}</span>
              
              {/* Active indicator (orange dot on left side when app is open) */}
              {appIsOpen && (
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r"></div>
              )}
              
              {/* Hover indicator */}
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r opacity-0 group-hover:opacity-30 transition-opacity"></div>
            </div>
          );
        })}
      </div>

      {/* Trash */}
      <div className="w-10 h-10 rounded-sm bg-gray-700 bg-opacity-0 hover:bg-opacity-100 transition-all duration-200 flex items-center justify-center cursor-pointer mt-auto">
        <span className="text-lg">🗑️</span>
      </div>
    </div>
  );
};

export default Dock;
