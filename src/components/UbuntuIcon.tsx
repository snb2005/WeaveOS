import React from 'react';

// Import all Papirus icon assets
import folderIcon from '../assets/icons/folder.svg';
import terminalIcon from '../assets/icons/terminal.svg';
import settingsIcon from '../assets/icons/settings.svg';
import browserIcon from '../assets/icons/browser.svg';
import fileIcon from '../assets/icons/file.svg';
import closeIcon from '../assets/icons/close.svg';
import minimizeIcon from '../assets/icons/minimize.svg';
import maximizeIcon from '../assets/icons/maximize.svg';
import fileManagerIcon from '../assets/icons/file-manager.svg';
import homeIcon from '../assets/icons/home.svg';
import desktopIcon from '../assets/icons/desktop.svg';
import calculatorIcon from '../assets/icons/calculator.svg';
import mediaPlayerIcon from '../assets/icons/media-player.svg';
import paletteIcon from '../assets/icons/palette.svg';

// Define available icon types
export type IconType = 
  | 'folder'
  | 'terminal'
  | 'settings'
  | 'browser'
  | 'file'
  | 'close'
  | 'minimize'
  | 'maximize'
  | 'file-manager'
  | 'home'
  | 'desktop'
  | 'calculator'
  | 'media-player'
  | 'palette';

// Icon mapping object
const iconMap: Record<IconType, string> = {
  'folder': folderIcon,
  'terminal': terminalIcon,
  'settings': settingsIcon,
  'browser': browserIcon,
  'file': fileIcon,
  'close': closeIcon,
  'minimize': minimizeIcon,
  'maximize': maximizeIcon,
  'file-manager': fileManagerIcon,
  'home': homeIcon,
  'desktop': desktopIcon,
  'calculator': calculatorIcon,
  'media-player': mediaPlayerIcon,
  'palette': paletteIcon,
};

interface UbuntuIconProps {
  /** Icon type from Papirus theme */
  name: IconType;
  /** Size className (e.g., 'w-6 h-6', 'w-8 h-8') */
  size?: string;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * UbuntuIcon - A component for displaying Papirus Ubuntu-style icons
 * 
 * Uses the high-quality Papirus icon theme for authentic Ubuntu look and feel.
 * All icons are SVG format for perfect scaling on any display.
 * 
 * @example
 * <UbuntuIcon name="folder" size="w-8 h-8" />
 * <UbuntuIcon name="terminal" size="w-6 h-6" className="text-gray-600" />
 */
export const UbuntuIcon: React.FC<UbuntuIconProps> = ({
  name,
  size = 'w-6 h-6',
  className = '',
  alt,
  onClick,
}) => {
  const iconSrc = iconMap[name];
  
  if (!iconSrc) {
    console.warn(`UbuntuIcon: Icon "${name}" not found`);
    return null;
  }

  return (
    <img
      src={iconSrc}
      alt={alt || `${name} icon`}
      className={`${size} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      draggable={false}
      style={{
        // Ensure SVG icons inherit text color when needed
        filter: className.includes('text-') ? 'currentColor' : undefined,
      }}
    />
  );
};

// Utility function to check if an icon exists
export const hasIcon = (name: string): name is IconType => {
  return name in iconMap;
};

// Export all available icon names for convenience
export const availableIcons: IconType[] = Object.keys(iconMap) as IconType[];

export default UbuntuIcon;
