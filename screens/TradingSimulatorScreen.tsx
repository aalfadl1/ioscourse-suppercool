// screens/TradingSimulatorScreen.tsx
import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'

export default function TradingSimulatorScreen() {
  const { theme } = useTheme()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    emoji: {
      fontSize: 64,
      marginBottom: 20,
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.emoji}>🎮</Text>
      <Text style={styles.title}>Trading Simulator</Text>
      <Text style={styles.subtitle}>
        Practice trading with virtual money{'\n'}
        Weekly challenges and tournaments coming soon!
      </Text>
    </SafeAreaView>
  )
}