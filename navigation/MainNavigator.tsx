// navigation/MainNavigator.tsx
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import PremiumScreen from '../screens/PremiumScreen';
import AlertsScreen from '../screens/AlertsScreen';
import TradingSimulatorScreen from '../screens/TradingSimulatorScreen';
import WatchlistScreen from '../screens/WatchlistScreen';

// Stacks
import SearchStack from './SearchStack';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 4 },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>📊</Text>,
        }}
      />

      <Tab.Screen
        name="Search"
        component={SearchStack}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🔍</Text>,
        }}
      />

      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          tabBarLabel: 'Watchlist',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>⭐</Text>,
        }}
      />

      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🔔</Text>,
        }}
      />

      <Tab.Screen
        name="Simulator"
        component={TradingSimulatorScreen}
        options={{
          tabBarLabel: 'Simulator',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🎮</Text>,
        }}
      />

      <Tab.Screen
        name="Premium"
        component={PremiumScreen}
        options={{
          tabBarLabel: 'Premium',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>👑</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
