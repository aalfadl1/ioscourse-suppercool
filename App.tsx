// App.tsx
import 'react-native-gesture-handler';          // must be first
import 'react-native-url-polyfill/auto';

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import MainNavigator from './navigation/MainNavigator';
import { ThemeProvider } from './contexts/ThemeContext';

// Keep this if you use Stripe; otherwise remove the provider + import
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_PUBLISHABLE_KEY } from './lib/stripe';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY ?? ''}
        merchantIdentifier="merchant.com.trademasterpro"
      >
        <ThemeProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <MainNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </StripeProvider>
    </GestureHandlerRootView>
  );
}
