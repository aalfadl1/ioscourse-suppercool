import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

type ThemeMode = 'light' | 'dark'

interface ThemeColors {
  background: string
  surface: string
  primary: string
  secondary: string
  accent: string
  text: string
  textSecondary: string
  border: string
  success: string
  error: string
  warning: string
  header: string
  card: string
}

interface Theme {
  mode: ThemeMode
  colors: ThemeColors
}

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const lightTheme: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  primary: '#3B82F6',
  secondary: '#6B7280',
  accent: '#8B5CF6',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  header: '#FFFFFF',
  card: '#FFFFFF'
}

const darkTheme: ThemeColors = {
  background: '#111827',
  surface: '#1F2937',
  primary: '#3B82F6',
  secondary: '#9CA3AF',
  accent: '#8B5CF6',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  header: '#1F2937',
  card: '#1F2937'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('dark')

  useEffect(() => {
    loadTheme()
  }, [])

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme')
      if (savedTheme) {
        setMode(savedTheme as ThemeMode)
      }
    } catch (error) {
      console.error('Error loading theme:', error)
    }
  }

  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light'
    setMode(newMode)
    try {
      await AsyncStorage.setItem('theme', newMode)
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  const theme: Theme = {
    mode,
    colors: mode === 'light' ? lightTheme : darkTheme
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDark: mode === 'dark'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
