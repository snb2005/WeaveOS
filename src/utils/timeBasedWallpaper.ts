/**
 * Time-based wallpaper management utility
 * Automatically sets desktop background based on current time of day
 */

import React from 'react';

// Import the wallpaper images
import sunnydayImg from '../image/sunnyday.jpg';
import day1Img from '../image/day1.jpg';
import eveningImg from '../image/evening.jpg';
import night1Img from '../image/night1.jpg';
import night2Img from '../image/night2.jpg';

export interface TimeBasedWallpaper {
  image: string;
  timeRange: string;
  startHour: number;
  endHour: number;
}

export const TIME_BASED_WALLPAPERS: TimeBasedWallpaper[] = [
  {
    image: sunnydayImg,
    timeRange: '5 AM - 10 AM',
    startHour: 5,
    endHour: 10
  },
  {
    image: day1Img,
    timeRange: '10 AM - 4 PM',
    startHour: 10,
    endHour: 16
  },
  {
    image: eveningImg,
    timeRange: '4 PM - 7 PM',
    startHour: 16,
    endHour: 19
  },
  {
    image: night1Img,
    timeRange: '7 PM - 10 PM',
    startHour: 19,
    endHour: 22
  },
  {
    image: night2Img,
    timeRange: '10 PM - 5 AM',
    startHour: 22,
    endHour: 5 // This spans midnight
  }
];

/**
 * Get the appropriate wallpaper based on current time
 */
export function getCurrentTimeBasedWallpaper(): TimeBasedWallpaper {
  const now = new Date();
  const currentHour = now.getHours();

  // Handle the night2 case that spans midnight (22:00 - 05:00)
  for (const wallpaper of TIME_BASED_WALLPAPERS) {
    if (wallpaper.startHour > wallpaper.endHour) {
      // Spans midnight (e.g., 22:00 - 05:00)
      if (currentHour >= wallpaper.startHour || currentHour < wallpaper.endHour) {
        return wallpaper;
      }
    } else {
      // Normal range (e.g., 10:00 - 16:00)
      if (currentHour >= wallpaper.startHour && currentHour < wallpaper.endHour) {
        return wallpaper;
      }
    }
  }

  // Fallback to day1 if no match found
  return TIME_BASED_WALLPAPERS[1];
}

/**
 * Apply time-based wallpaper to an element
 */
export function applyTimeBasedWallpaper(element: HTMLElement): void {
  const wallpaper = getCurrentTimeBasedWallpaper();
  
  // Apply CSS styles for full-screen background
  element.style.backgroundImage = `url(${wallpaper.image})`;
  element.style.backgroundSize = 'cover';
  element.style.backgroundPosition = 'center';
  element.style.backgroundRepeat = 'no-repeat';
  element.style.backgroundAttachment = 'fixed';
  
  // Add smooth transition
  element.style.transition = 'background-image 1s ease-in-out';
  
  console.log(`🌅 Applied time-based wallpaper: ${wallpaper.timeRange} - ${wallpaper.image}`);
}

/**
 * Apply time-based wallpaper to the body element
 */
export function applyTimeBasedWallpaperToBody(): void {
  applyTimeBasedWallpaper(document.body);
}

/**
 * Apply time-based wallpaper to the desktop element
 */
export function applyTimeBasedWallpaperToDesktop(): void {
  const desktopElement = document.getElementById('desktop') || document.querySelector('.desktop');
  if (desktopElement) {
    applyTimeBasedWallpaper(desktopElement as HTMLElement);
  }
}

/**
 * Get CSS object for time-based wallpaper (for React components)
 */
export function getTimeBasedWallpaperStyle(): React.CSSProperties {
  const wallpaper = getCurrentTimeBasedWallpaper();
  
  return {
    backgroundImage: `url(${wallpaper.image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    transition: 'background-image 1s ease-in-out'
  };
}

/**
 * Initialize time-based wallpaper system
 * Sets initial wallpaper and optionally starts auto-update
 */
export function initializeTimeBasedWallpaper(options: {
  target?: 'body' | 'desktop' | HTMLElement;
  autoUpdate?: boolean;
  updateInterval?: number; // in milliseconds
} = {}): (() => void) | null {
  const {
    target = 'body',
    autoUpdate = true,
    updateInterval = 60 * 60 * 1000 // 1 hour
  } = options;

  // Apply initial wallpaper
  if (target === 'body') {
    applyTimeBasedWallpaperToBody();
  } else if (target === 'desktop') {
    applyTimeBasedWallpaperToDesktop();
  } else if (target instanceof HTMLElement) {
    applyTimeBasedWallpaper(target);
  }

  // Set up auto-update if requested
  if (autoUpdate) {
    const intervalId = setInterval(() => {
      if (target === 'body') {
        applyTimeBasedWallpaperToBody();
      } else if (target === 'desktop') {
        applyTimeBasedWallpaperToDesktop();
      } else if (target instanceof HTMLElement) {
        applyTimeBasedWallpaper(target);
      }
    }, updateInterval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  return null;
}

/**
 * Hook for React components to use time-based wallpaper
 */
export function useTimeBasedWallpaper(autoUpdate: boolean = true): {
  wallpaperStyle: React.CSSProperties;
  currentWallpaper: TimeBasedWallpaper;
  refresh: () => void;
} {
  const [currentWallpaper, setCurrentWallpaper] = React.useState<TimeBasedWallpaper>(
    getCurrentTimeBasedWallpaper()
  );

  const refresh = React.useCallback(() => {
    setCurrentWallpaper(getCurrentTimeBasedWallpaper());
  }, []);

  React.useEffect(() => {
    if (autoUpdate) {
      // Update every hour
      const intervalId = setInterval(refresh, 60 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [autoUpdate, refresh]);

  const wallpaperStyle = React.useMemo(() => ({
    backgroundImage: `url(${currentWallpaper.image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    transition: 'background-image 1s ease-in-out'
  }), [currentWallpaper]);

  return {
    wallpaperStyle,
    currentWallpaper,
    refresh
  };
}
