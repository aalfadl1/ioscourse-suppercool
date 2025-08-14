import React from 'react'
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={toggleTheme}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, { opacity: isDark ? 0.3 : 1 }]}>☀️</Text>
        <View style={[
          styles.switch, 
          { backgroundColor: theme.colors.primary },
          isDark && styles.switchDark
        ]}>
          <View style={[
            styles.thumb,
            { backgroundColor: theme.colors.surface },
            isDark && styles.thumbDark
          ]} />
        </View>
        <Text style={[styles.icon, { opacity: isDark ? 1 : 0.3 }]}>🌙</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 25,
    borderWidth: 1,
    padding: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchDark: {
    backgroundColor: '#374151',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbDark: {
    alignSelf: 'flex-end',
  },
})