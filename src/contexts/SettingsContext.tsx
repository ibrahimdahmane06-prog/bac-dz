import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontSizeValue = 'sm' | 'md' | 'lg' | 'xl';
export type AppThemeValue = 'emerald' | 'sapphire' | 'violet' | 'bronze' | 'charcoal';

export interface HomeLayoutSettings {
  showStats: boolean;
  showTip: boolean;
  showSolver: boolean;
  showPhilosophyCard: boolean;
  isGridLayout: boolean;
  subjectsOrder: string[]; // List of subject IDs determining their sequence
}

interface SettingsContextType {
  fontSize: FontSizeValue;
  theme: AppThemeValue;
  homeLayout: HomeLayoutSettings;
  updateFontSize: (size: FontSizeValue) => void;
  updateTheme: (newTheme: AppThemeValue) => void;
  updateHomeLayout: (newLayout: Partial<HomeLayoutSettings>) => void;
  resetAllSettings: () => void;
  getFontSizeClass: (contextType: 'body' | 'title' | 'sub') => string;
  themeColors: Record<AppThemeValue, {
    primary: string;
    text: string;
    bg: string;
    border: string;
    badge: string;
    hover: string;
    gradient: string;
    shadow: string;
  }>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultHomeLayout: HomeLayoutSettings = {
  showStats: true,
  showTip: true,
  showSolver: true,
  showPhilosophyCard: true,
  isGridLayout: true,
  subjectsOrder: ['philosophy', 'arabic', 'history-geo', 'islamic', 'english', 'french', 'math'],
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSizeValue>(() => {
    return (localStorage.getItem('user_font_size') as FontSizeValue) || 'md';
  });

  const [theme, setThemeState] = useState<AppThemeValue>(() => {
    return (localStorage.getItem('user_app_theme') as AppThemeValue) || 'emerald';
  });

  const [homeLayout, setHomeLayoutState] = useState<HomeLayoutSettings>(() => {
    try {
      const saved = localStorage.getItem('user_home_layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all properties exist
        return { ...defaultHomeLayout, ...parsed };
      }
    } catch (e) {
      console.error('Error loading default home layout settings:', e);
    }
    return defaultHomeLayout;
  });

  const updateFontSize = (size: FontSizeValue) => {
    setFontSizeState(size);
    localStorage.setItem('user_font_size', size);
  };

  const updateTheme = (newTheme: AppThemeValue) => {
    setThemeState(newTheme);
    localStorage.setItem('user_app_theme', newTheme);
  };

  const updateHomeLayout = (newLayout: Partial<HomeLayoutSettings>) => {
    setHomeLayoutState(prev => {
      const updated = { ...prev, ...newLayout };
      localStorage.setItem('user_home_layout', JSON.stringify(updated));
      return updated;
    });
  };

  const resetAllSettings = () => {
    setFontSizeState('md');
    setThemeState('emerald');
    setHomeLayoutState(defaultHomeLayout);
    localStorage.removeItem('user_font_size');
    localStorage.removeItem('user_app_theme');
    localStorage.removeItem('user_home_layout');
  };

  // Maps theme values to Tailwind color class equivalents dynamically
  const themeColors: Record<AppThemeValue, {
    primary: string;
    text: string;
    bg: string;
    border: string;
    badge: string;
    hover: string;
    gradient: string;
    shadow: string;
  }> = {
    emerald: {
      primary: 'emerald-600',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100',
      badge: 'bg-emerald-100 text-emerald-800',
      hover: 'hover:bg-emerald-700',
      gradient: 'from-emerald-600 to-teal-500',
      shadow: 'shadow-emerald-100'
    },
    sapphire: {
      primary: 'blue-600',
      text: 'text-blue-700',
      bg: 'bg-blue-50/50',
      border: 'border-blue-100',
      badge: 'bg-blue-100 text-blue-800',
      hover: 'hover:bg-blue-700',
      gradient: 'from-blue-600 to-indigo-500',
      shadow: 'shadow-blue-100'
    },
    violet: {
      primary: 'purple-600',
      text: 'text-purple-700',
      bg: 'bg-purple-50/50',
      border: 'border-purple-100',
      badge: 'bg-purple-100 text-purple-800',
      hover: 'hover:bg-purple-700',
      gradient: 'from-purple-600 to-pink-500',
      shadow: 'shadow-purple-100'
    },
    bronze: {
      primary: 'amber-600',
      text: 'text-amber-800',
      bg: 'bg-amber-50/60',
      border: 'border-amber-100',
      badge: 'bg-amber-100 text-amber-900',
      hover: 'hover:bg-amber-700',
      gradient: 'from-amber-600 to-orange-500',
      shadow: 'shadow-amber-100'
    },
    charcoal: {
      primary: 'slate-800',
      text: 'text-slate-700',
      bg: 'bg-slate-50/80 border-slate-100',
      border: 'border-slate-200',
      badge: 'bg-slate-200 text-slate-800',
      hover: 'hover:bg-slate-900',
      gradient: 'from-slate-800 to-slate-700',
      shadow: 'shadow-slate-100'
    }
  };

  const getFontSizeClass = (contextType: 'body' | 'title' | 'sub') => {
    if (contextType === 'body') {
      switch (fontSize) {
        case 'sm': return 'text-[11px] leading-relaxed';
        case 'md': return 'text-[13px] md:text-sm leading-relaxed';
        case 'lg': return 'text-base md:text-lg leading-relaxed';
        case 'xl': return 'text-lg md:text-xl leading-relaxed';
      }
    } else if (contextType === 'title') {
      switch (fontSize) {
        case 'sm': return 'text-sm md:text-base font-black';
        case 'md': return 'text-base md:text-lg font-black';
        case 'lg': return 'text-lg md:text-xl font-black';
        case 'xl': return 'text-xl md:text-2xl font-black';
      }
    } else { // sub context
      switch (fontSize) {
        case 'sm': return 'text-[9px] font-bold';
        case 'md': return 'text-[11px] font-bold';
        case 'lg': return 'text-xs md:text-sm font-bold';
        case 'xl': return 'text-sm md:text-base font-bold';
      }
    }
  };

  return (
    <SettingsContext.Provider value={{
      fontSize,
      theme,
      homeLayout,
      updateFontSize,
      updateTheme,
      updateHomeLayout,
      resetAllSettings,
      getFontSizeClass,
      themeColors
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
