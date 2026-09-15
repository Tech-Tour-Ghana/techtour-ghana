'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDimMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDimMode, setIsDimMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load theme from localStorage immediately
    const savedTheme = localStorage.getItem('theme');
    let isDim = false;
    
    if (savedTheme) {
      isDim = savedTheme === 'dim';
    } else {
      // If no saved theme, use system preference
      isDim = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Save the default
      localStorage.setItem('theme', isDim ? 'dim' : 'bright');
    }
    
    setIsDimMode(isDim);
    document.documentElement.setAttribute('data-theme', isDim ? 'dim' : 'bright');
    setIsMounted(true);

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newIsDim = e.newValue === 'dim';
        setIsDimMode(newIsDim);
        document.documentElement.setAttribute('data-theme', newIsDim ? 'dim' : 'bright');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDimMode;
    setIsDimMode(newTheme);
    const themeValue = newTheme ? 'dim' : 'bright';
    localStorage.setItem('theme', themeValue);
    document.documentElement.setAttribute('data-theme', themeValue);
    
    // Dispatch storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: themeValue,
    }));
  };

  // Don't render children until theme is loaded to prevent flash
  if (!isMounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDimMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}