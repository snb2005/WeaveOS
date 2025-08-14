import React from 'react';
import { IconShowcase } from '../components/IconShowcase';

interface IconDemoAppProps {
  windowId?: string;
}

/**
 * IconDemoApp - A demonstration app showing all available Ubuntu icons
 * 
 * This app showcases the Papirus icon theme integration and can be opened
 * from the dock to test icon functionality.
 */
const IconDemoApp: React.FC<IconDemoAppProps> = ({ windowId: _windowId }) => {
  return (
    <div className="h-full bg-theme-primary text-theme-primary overflow-auto">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            🎨 Weave OS Icon Gallery
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Papirus Ubuntu Icon Theme Integration - High-quality SVG icons for the perfect Ubuntu experience
          </p>
        </div>
        
        <IconShowcase />
        
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
          <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-4">
            ✨ Features
          </h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• 🎯 <strong>Perfect Scaling:</strong> SVG format ensures crisp icons at any size</li>
            <li>• 🎨 <strong>Ubuntu Authentic:</strong> Official Papirus theme used in Ubuntu</li>
            <li>• ⚡ <strong>Performance:</strong> Optimized vector graphics with minimal file sizes</li>
            <li>• 🌙 <strong>Theme Support:</strong> Works perfectly with light/dark themes</li>
            <li>• 🛠️ <strong>Developer Friendly:</strong> Easy to use React component interface</li>
          </ul>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            📚 Installation Complete
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            The Papirus icon theme has been successfully integrated into Weave OS. 
            All window controls, dock items, and application icons now use authentic Ubuntu styling.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IconDemoApp;
