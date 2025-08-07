import React, { useState } from 'react';
import { useWindowStore } from '../store/windowStore';

const TaskBar: React.FC = () => {
  const { windows, focusWindow, minimizeWindow, closeWindow } = useWindowStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get minimized windows
  const minimizedWindows = windows.filter(w => w.isMinimized && w.isVisible);
  const hasMinimizedWindows = minimizedWindows.length > 0;

  if (!hasMinimizedWindows) {
    return null;
  }

  const getAppIcon = (app: string) => {
    const icons: { [key: string]: string } = {
      'Files': '📁',
      'Terminal': '💻',
      'Settings': '⚙️',
      'Calculator': '🧮',
      'TextEditor': '📝',
      'Text Editor': '📝',
      'Browser': '🌐',
      'Media Player': '🎵',
    };
    return icons[app] || '📱';
  };

  const restoreWindow = (windowId: string) => {
    focusWindow(windowId); // This will also set isMinimized to false
  };

  return (
    <div className="fixed bottom-24 right-4 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2 w-12 h-12 bg-zinc-800/90 backdrop-blur-sm border border-zinc-600/50 rounded-xl
          flex items-center justify-center text-white hover:bg-zinc-700/90 transition-all duration-200
          shadow-lg hover:shadow-xl"
        title={`${minimizedWindows.length} minimized window${minimizedWindows.length !== 1 ? 's' : ''}`}
      >
        <div className="relative">
          <span className="text-xl">📋</span>
          {minimizedWindows.length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs
              rounded-full flex items-center justify-center font-medium">
              {minimizedWindows.length > 9 ? '9+' : minimizedWindows.length}
            </div>
          )}
        </div>
      </button>

      {/* Minimized Windows List */}
      {isExpanded && (
        <div className="bg-zinc-800/95 backdrop-blur-sm border border-zinc-600/50 rounded-xl p-2
          shadow-2xl max-h-96 overflow-y-auto min-w-72">
          <div className="text-zinc-300 text-xs font-medium mb-2 px-2">
            Minimized Windows ({minimizedWindows.length})
          </div>
          
          <div className="space-y-1">
            {minimizedWindows.map((window) => (
              <div
                key={window.id}
                className="group flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700/50
                  transition-all duration-200 cursor-pointer"
                onClick={() => restoreWindow(window.id)}
              >
                {/* App Icon */}
                <div className="w-8 h-8 flex items-center justify-center text-lg">
                  {getAppIcon(window.app)}
                </div>

                {/* Window Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {window.title}
                  </div>
                  <div className="text-zinc-400 text-xs truncate">
                    {window.app}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restoreWindow(window.id);
                    }}
                    className="w-6 h-6 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-400
                      flex items-center justify-center text-xs transition-colors"
                    title="Restore"
                  >
                    ↗
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeWindow(window.id);
                    }}
                    className="w-6 h-6 bg-red-500/20 hover:bg-red-500/30 rounded text-red-400
                      flex items-center justify-center text-xs transition-colors"
                    title="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="border-t border-zinc-600/50 mt-2 pt-2">
            <button
              onClick={() => {
                minimizedWindows.forEach(w => focusWindow(w.id));
                setIsExpanded(false);
              }}
              className="w-full p-2 text-zinc-300 hover:text-white hover:bg-zinc-700/50
                rounded-lg text-xs transition-all duration-200"
            >
              Restore All Windows
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBar;
