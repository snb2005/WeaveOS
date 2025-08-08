// Wallpaper management utility
export class WallpaperManager {
  private static instance: WallpaperManager;
  private currentWallpaper: string = 'gradient-blue';
  private liveWallpaperInterval: NodeJS.Timeout | null = null;
  private liveWallpapers = [
    '/images/day1.jpg',
    '/images/evening.jpg', 
    '/images/night1.jpg',
    '/images/night2.jpg',
    '/images/sunnyday.jpg'
  ];
  private currentImageIndex: number = 0;

  private constructor() {}

  public static getInstance(): WallpaperManager {
    if (!WallpaperManager.instance) {
      WallpaperManager.instance = new WallpaperManager();
      // Make it globally accessible for debugging
      (window as any).WallpaperManager = WallpaperManager;
    }
    return WallpaperManager.instance;
  }

  public setWallpaper(wallpaperId: string): void {
    console.log(`🖼️ Setting wallpaper to: ${wallpaperId}`);
    this.currentWallpaper = wallpaperId;
    
    // Clear any existing wallpaper first
    this.stopLiveWallpaper();
    this.clearAllBackgrounds();
    
    if (wallpaperId === 'live') {
      this.startLiveWallpaper();
    } else if (wallpaperId.startsWith('custom-')) {
      // Handle custom wallpapers
      const customWallpapers = JSON.parse(localStorage.getItem('weave-custom-wallpapers') || '[]');
      const customWallpaper = customWallpapers.find((w: any) => w.id === wallpaperId);
      if (customWallpaper) {
        this.setCustomWallpaper(customWallpaper.url);
      }
    } else {
      this.applyStaticWallpaper(wallpaperId);
    }
    
    // Store preference with timestamp for debugging
    localStorage.setItem('weave-wallpaper', wallpaperId);
    localStorage.setItem('weave-wallpaper-timestamp', Date.now().toString());
    console.log(`✅ Wallpaper ${wallpaperId} applied and saved to localStorage`);
  }

  public setCustomWallpaper(imageUrl: string): void {
    // Clear any existing wallpaper
    this.stopLiveWallpaper();
    this.clearAllBackgrounds();
    
    // Add class to body to remove background
    document.body.classList.add('live-wallpaper-active');
    
    // Create image element for custom wallpaper with higher z-index priority
    const img = document.createElement('img');
    img.className = 'live-wallpaper custom-wallpaper';
    img.id = 'custom-wallpaper-img';
    img.src = imageUrl;
    img.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: -100 !important;
      object-fit: cover !important;
      opacity: 1 !important;
      pointer-events: none !important;
      transition: opacity 0.5s ease-in-out !important;
    `;
    
    // Insert at the very beginning of body to ensure it's behind everything
    if (document.body.firstChild) {
      document.body.insertBefore(img, document.body.firstChild);
    } else {
      document.body.appendChild(img);
    }
    
    console.log('🖼️ Custom wallpaper applied:', imageUrl.substring(0, 50) + '...');
  }

  private startLiveWallpaper(): void {
    // Remove any existing wallpaper elements
    this.clearAllBackgrounds();
    
    // Add class to body to remove background
    document.body.classList.add('live-wallpaper-active');
    
    // Create image element for live wallpaper with better z-index
    const img = document.createElement('img');
    img.className = 'live-wallpaper';
    img.id = 'live-wallpaper-img';
    img.src = this.liveWallpapers[this.currentImageIndex];
    img.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: -100 !important;
      object-fit: cover !important;
      opacity: 1 !important;
      transition: opacity 1s ease-in-out !important;
      pointer-events: none !important;
    `;
    
    // Insert at the very beginning of body to ensure it's behind everything
    if (document.body.firstChild) {
      document.body.insertBefore(img, document.body.firstChild);
    } else {
      document.body.appendChild(img);
    }
    
    // Set up interval to change images every 10 seconds
    this.liveWallpaperInterval = setInterval(() => {
      this.switchToNextImage();
    }, 10000);

    console.log('🖼️ Live wallpaper started with image:', this.liveWallpapers[this.currentImageIndex]);
  }

  private switchToNextImage(): void {
    const currentImg = document.getElementById('live-wallpaper-img') as HTMLImageElement;
    if (!currentImg) return;

    // Create new image for smooth transition with better z-index
    const newImg = document.createElement('img');
    newImg.className = 'live-wallpaper';
    newImg.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: -100 !important;
      object-fit: cover !important;
      opacity: 0 !important;
      transition: opacity 1s ease-in-out !important;
      pointer-events: none !important;
    `;
    
    // Move to next image
    this.currentImageIndex = (this.currentImageIndex + 1) % this.liveWallpapers.length;
    newImg.src = this.liveWallpapers[this.currentImageIndex];
    
    // Insert new image before current one to ensure proper layering
    document.body.insertBefore(newImg, currentImg);
    
    // Fade in new image
    setTimeout(() => {
      newImg.style.opacity = '1';
    }, 50);
    
    // Remove old image after transition and assign new ID
    setTimeout(() => {
      if (currentImg.parentNode) {
        currentImg.parentNode.removeChild(currentImg);
      }
      newImg.id = 'live-wallpaper-img';
    }, 1000);

    console.log(`🖼️ Switched to image ${this.currentImageIndex + 1}/${this.liveWallpapers.length}: ${this.liveWallpapers[this.currentImageIndex]}`);
  }

  private stopLiveWallpaper(): void {
    if (this.liveWallpaperInterval) {
      clearInterval(this.liveWallpaperInterval);
      this.liveWallpaperInterval = null;
    }
    
    // Remove class from body to restore background
    document.body.classList.remove('live-wallpaper-active');
    
    this.clearWallpaperElements();
    console.log('🖼️ Live wallpaper stopped');
  }

  private applyStaticWallpaper(wallpaperId: string): void {
    // Remove any existing wallpaper elements
    this.clearWallpaperElements();
    
    // Apply gradient wallpaper to body
    const wallpaperClasses = {
      'gradient-blue': 'from-blue-600 to-purple-700',
      'gradient-sunset': 'from-orange-400 to-red-600', 
      'gradient-forest': 'from-green-600 to-teal-700',
      'gradient-space': 'from-purple-900 to-black'
    };

    const gradientClass = wallpaperClasses[wallpaperId as keyof typeof wallpaperClasses];
    if (gradientClass) {
      // Remove existing gradient classes
      document.body.className = document.body.className
        .replace(/bg-gradient-to-br/g, '')
        .replace(/from-\w+-\d+/g, '')
        .replace(/to-\w+-\d+/g, '')
        .trim();
      
      // Add new gradient classes
      document.body.classList.add('bg-gradient-to-br', ...gradientClass.split(' '));
      console.log(`🖼️ Applied ${wallpaperId} wallpaper`);
    }
  }

  private clearWallpaperElements(): void {
    // Remove live wallpaper images
    const liveWallpapers = document.querySelectorAll('.live-wallpaper');
    liveWallpapers.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Remove custom wallpaper if exists
    const customWallpaper = document.getElementById('custom-wallpaper-img');
    if (customWallpaper && customWallpaper.parentNode) {
      customWallpaper.parentNode.removeChild(customWallpaper);
    }
  }

  private clearAllBackgrounds(): void {
    // Clear wallpaper elements
    this.clearWallpaperElements();
    
    // Clear gradient classes from body
    document.body.className = document.body.className
      .replace(/bg-gradient-to-br/g, '')
      .replace(/from-\w+-\d+/g, '')
      .replace(/to-\w+-\d+/g, '')
      .replace(/live-wallpaper-active/g, '')
      .trim();
    
    // Clear background styles from body only
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
    
    console.log('🧹 Background cleared from body only');
  }

  public getCurrentWallpaper(): string {
    return this.currentWallpaper;
  }

  public initializeFromStorage(): void {
    const savedWallpaper = localStorage.getItem('weave-wallpaper');
    const timestamp = localStorage.getItem('weave-wallpaper-timestamp');
    
    console.log('🔄 Initializing wallpaper from storage:', {
      savedWallpaper,
      timestamp: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'none'
    });
    
    if (savedWallpaper) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        this.setWallpaper(savedWallpaper);
      }, 100);
    } else {
      // Default to live wallpaper
      setTimeout(() => {
        this.setWallpaper('live');
      }, 100);
    }
  }

  // Debug method to manually trigger next image
  public debugNextImage(): void {
    if (this.currentWallpaper === 'live') {
      this.switchToNextImage();
    }
  }

  // Debug method to check current state
  public debugGetState(): any {
    return {
      currentWallpaper: this.currentWallpaper,
      currentImageIndex: this.currentImageIndex,
      isLiveWallpaperActive: !!this.liveWallpaperInterval,
      liveWallpapers: this.liveWallpapers,
      currentImageSrc: this.liveWallpapers[this.currentImageIndex]
    };
  }
}

// Theme management
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: string = 'dark';

  private constructor() {}

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  public setTheme(themeId: string): void {
    console.log(`🎨 Setting theme to: ${themeId}`);
    this.currentTheme = themeId;
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light-theme', 'dark-theme');
    
    if (themeId === 'light') {
      root.classList.add('light-theme');
      console.log('🎨 Applied light theme');
    } else if (themeId === 'dark') {
      root.classList.add('dark-theme');
      console.log('🎨 Applied dark theme');
    } else if (themeId === 'auto') {
      // Auto theme - detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
      console.log(`🎨 Applied auto theme (${prefersDark ? 'dark' : 'light'})`);
    }
    
    // Store preference
    localStorage.setItem('weave-theme', themeId);
    
    // Dispatch theme change event for apps to listen
    window.dispatchEvent(new CustomEvent('weave-theme-changed', {
      detail: { 
        theme: themeId,
        isLight: themeId === 'light' || (themeId === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches)
      }
    }));
  }

  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  public initializeFromStorage(): void {
    const savedTheme = localStorage.getItem('weave-theme');
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('dark');
    }
  }
}
