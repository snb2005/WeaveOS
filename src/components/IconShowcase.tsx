import React from 'react';
import { UbuntuIcon, availableIcons } from './UbuntuIcon';

interface IconShowcaseProps {
  className?: string;
}

/**
 * IconShowcase - Displays all available Papirus Ubuntu icons
 * 
 * This component shows all the icons you've integrated from the Papirus theme.
 * Useful for development and testing icon integration.
 */
export const IconShowcase: React.FC<IconShowcaseProps> = ({ className = '' }) => {
  return (
    <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        🎨 Papirus Ubuntu Icons
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {availableIcons.map((iconName) => (
          <div
            key={iconName}
            className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <UbuntuIcon
              name={iconName}
              size="w-12 h-12"
              className="mb-2"
            />
            <span className="text-xs text-center text-gray-600 dark:text-gray-300 font-medium">
              {iconName}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          Usage Examples:
        </h3>
        <div className="space-y-2 text-sm font-mono text-gray-700 dark:text-gray-300">
          <div>{'<UbuntuIcon name="folder" size="w-8 h-8" />'}</div>
          <div>{'<UbuntuIcon name="terminal" size="w-6 h-6" className="text-blue-500" />'}</div>
          <div>{'<UbuntuIcon name="settings" size="w-10 h-10" onClick={() => console.log(\'clicked\')} />'}</div>
        </div>
      </div>
    </div>
  );
};

export default IconShowcase;
