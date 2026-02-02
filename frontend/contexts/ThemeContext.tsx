import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { useAuth } from './AuthContext';

interface Theme {
  primary: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

const lightTheme: Theme = {
  primary: '#6B46C1',
  background: '#F7FAFC',
  card: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#718096',
  border: '#E2E8F0',
  accent: '#9F7AEA',
  success: '#48BB78',
  warning: '#ED8936',
  error: '#F56565',
};

const darkTheme: Theme = {
  primary: '#9F7AEA',
  background: '#1A202C',
  card: '#2D3748',
  text: '#F7FAFC',
  textSecondary: '#A0AEC0',
  border: '#4A5568',
  accent: '#B794F4',
  success: '#68D391',
  warning: '#F6AD55',
  error: '#FC8181',
};

interface ThemeContextData {
  theme: Theme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const systemColorScheme = useColorScheme();
  
  const userTheme = user?.theme || 'light';
  const isDark = userTheme === 'dark' || (userTheme === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
