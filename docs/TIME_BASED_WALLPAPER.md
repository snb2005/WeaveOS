# Time-Based Desktop Background System

A JavaScript utility that automatically changes your desktop background based on the current time of day, creating a dynamic and immersive experience.

## 🌅 Time Schedule

The system automatically switches between 5 beautiful images throughout the day:

- **5 AM - 10 AM**: `sunnyday.jpg` - Fresh morning sunshine
- **10 AM - 4 PM**: `day1.jpg` - Bright daytime scenes  
- **4 PM - 7 PM**: `evening.jpg` - Golden hour vibes
- **7 PM - 10 PM**: `night1.jpg` - Early evening atmosphere
- **10 PM - 5 AM**: `night2.jpg` - Deep night serenity

## 🚀 Quick Start

### For React/TypeScript Projects (like Weave OS)

```typescript
import { getTimeBasedWallpaperStyle, useTimeBasedWallpaper } from './utils/timeBasedWallpaper';

// Option 1: Get CSS style object
const wallpaperStyle = getTimeBasedWallpaperStyle();

// Option 2: Use React hook with auto-updates
const { wallpaperStyle, currentWallpaper, refresh } = useTimeBasedWallpaper(true);

// Apply to component
<div style={wallpaperStyle}>
  Your content here
</div>
```

### For Vanilla JavaScript/HTML

```html
<!-- Include the script -->
<script src="./src/utils/timeBasedWallpaper.js"></script>

<script>
  // Auto-initialize (happens automatically)
  // Or manually initialize:
  const cleanup = TimeBasedWallpaper.initTimeBasedWallpaper({
    target: 'body', // or '#myElement' or '.myClass'
    autoUpdate: true,
    updateInterval: 60 * 60 * 1000 // 1 hour
  });
  
  // Stop auto-updates when needed
  // cleanup();
</script>
```

## 📋 API Reference

### Core Functions

#### `getCurrentTimeBasedWallpaper()`
Returns the wallpaper object for the current time.

#### `setTimeBasedDesktopBackground()`
Applies time-based wallpaper to the document body.

#### `initTimeBasedWallpaper(options)`
Initializes the time-based wallpaper system.

**Options:**
- `target`: Target element (`'body'`, `'#elementId'`, `'.className'`, or HTMLElement)
- `autoUpdate`: Enable hourly auto-updates (default: `true`)
- `updateInterval`: Update frequency in milliseconds (default: 1 hour)

**Returns:** Cleanup function to stop auto-updates, or `null`

### Utility Functions

#### `setTimeBasedBackgroundById(elementId)`
Apply wallpaper to element by ID.

#### `setTimeBasedBackgroundBySelector(selector)`
Apply wallpaper to element by CSS selector.

#### `getCurrentWallpaperInfo()`
Get detailed info about current wallpaper (for debugging).

## 🎨 CSS Styling

The system applies the following CSS properties:

```css
background-image: url(path/to/image.jpg);
background-size: cover;
background-position: center;
background-repeat: no-repeat;
background-attachment: fixed;
transition: background-image 1s ease-in-out;
```

## 🔧 Customization

### Change Time Ranges
Edit the `TIME_BASED_WALLPAPERS` array in the utility files:

```javascript
const TIME_BASED_WALLPAPERS = [
  {
    image: './src/image/custom-morning.jpg',
    timeRange: '6 AM - 11 AM',
    startHour: 6,
    endHour: 11
  },
  // ... more wallpapers
];
```

### Add Your Own Images
1. Place images in `/src/image/` directory
2. Update the wallpaper array with your image paths
3. Restart the application

### Custom Update Intervals
```javascript
initTimeBasedWallpaper({
  target: 'body',
  autoUpdate: true,
  updateInterval: 30 * 60 * 1000 // Update every 30 minutes
});
```

## 🌟 Integration Examples

### Weave OS Desktop Component
The time-based wallpaper is integrated into the Settings app:
1. Open Settings
2. Go to Appearance
3. Select "Time-Based Auto" wallpaper
4. Enjoy automatic background changes!

### Standalone HTML Page
See `/public/time-based-wallpaper-demo.html` for a complete working example with controls and info display.

### Custom React Component
```typescript
import React from 'react';
import { useTimeBasedWallpaper } from '../utils/timeBasedWallpaper';

const MyComponent: React.FC = () => {
  const { wallpaperStyle, currentWallpaper } = useTimeBasedWallpaper();
  
  return (
    <div style={wallpaperStyle} className="min-h-screen">
      <h1>Current period: {currentWallpaper.timeRange}</h1>
    </div>
  );
};
```

## 🐛 Troubleshooting

### Images Not Loading
- Ensure image paths are correct relative to your HTML file
- Check that images exist in `/src/image/` directory
- Verify image file extensions match the code

### Background Not Updating
- Check browser console for errors
- Verify auto-update is enabled
- Try calling `refreshBackground()` manually

### Performance Issues
- Increase update interval if needed
- Disable auto-update and trigger manually
- Optimize image file sizes

## 🎯 Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers
- ✅ Works with or without frameworks
- ✅ Progressive enhancement ready

## 📝 License

Part of the Weave OS project. See main project license for details.

---

*Enjoy your dynamic, time-aware desktop experience! 🌅🌆🌙*
