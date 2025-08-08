import { useState, useEffect } from 'react';

export interface ThemeState {
  theme: string;
  isLight: boolean;
}

export const useTheme = () => {
  const [themeState, setThemeState] = useState<ThemeState>({
    theme: 'dark',
    isLight: false
  });

  useEffect(() => {
    // Listen for theme changes
    const handleThemeChange = (event: CustomEvent<ThemeState>) => {
      setThemeState(event.detail);
    };

    // Get initial theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('weave-theme') || 'dark';
    const isLight = savedTheme === 'light' || 
      (savedTheme === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setThemeState({ theme: savedTheme, isLight });

    window.addEventListener('weave-theme-changed', handleThemeChange as EventListener);
    return () => {
      window.removeEventListener('weave-theme-changed', handleThemeChange as EventListener);
    };
  }, []);

  return themeState;
};

// Theme-aware class helpers
export const getThemeClasses = (isLight: boolean) => ({
  // Background colors
  bgPrimary: isLight ? 'bg-white' : 'bg-zinc-900',
  bgSecondary: isLight ? 'bg-slate-50' : 'bg-zinc-800',
  bgTertiary: isLight ? 'bg-slate-100' : 'bg-zinc-700',
  bgHover: isLight ? 'hover:bg-slate-100' : 'hover:bg-zinc-700/50',
  bgActive: isLight ? 'bg-slate-200' : 'bg-zinc-600',
  bgGlass: isLight ? 'bg-white/90' : 'bg-zinc-800/80',
  
  // Text colors
  textPrimary: isLight ? 'text-slate-900' : 'text-white',
  textSecondary: isLight ? 'text-slate-700' : 'text-gray-300',
  textMuted: isLight ? 'text-slate-500' : 'text-gray-500',
  
  // Border colors
  border: isLight ? 'border-slate-300' : 'border-zinc-700',
  borderHover: isLight ? 'border-slate-400' : 'border-zinc-600',
  
  // Input/form styles
  input: isLight 
    ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400' 
    : 'bg-zinc-800 border-zinc-600 text-white placeholder-gray-400',
  inputFocus: isLight ? 'focus:border-blue-500' : 'focus:border-blue-400',
  
  // Button styles
  button: isLight 
    ? 'bg-slate-100 hover:bg-slate-200 text-slate-900' 
    : 'bg-zinc-700 hover:bg-zinc-600 text-white',
  buttonPrimary: isLight 
    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
    : 'bg-blue-500 hover:bg-blue-600 text-white',
});
