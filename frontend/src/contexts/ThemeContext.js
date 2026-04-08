import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors } from '../constants/theme';

const THEME_KEY = 'app_theme';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false); // Default: Light
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved !== null) setIsDark(saved === 'dark');
      // If no saved preference → stays false (light)
    } catch (e) {
      console.error('Load theme error:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
  };

  const colors = getColors(isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, loading, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
