
// Test script to force restart live wallpaper
const wallpaperManager = window.WallpaperManager?.getInstance();
if (wallpaperManager) {
  wallpaperManager.setWallpaper('live');
  console.log('✅ Live wallpaper restarted manually');
} else {
  console.log('❌ WallpaperManager not found on window object');
}

