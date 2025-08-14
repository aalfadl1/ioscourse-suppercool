import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SymbolSearchScreen from '../screens/SymbolSearchScreen';
import SymbolDetailScreen from '../screens/SymbolDetailScreen';
import SymbolNewsScreen from '../screens/SymbolNewsScreen';
import SymbolChatScreen from '../screens/SymbolChatScreen';

const Stack = createNativeStackNavigator();

export default function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SymbolSearch">
      <Stack.Screen name="SymbolSearch" component={SymbolSearchScreen} />
      <Stack.Screen name="SymbolDetail" component={SymbolDetailScreen} />
      <Stack.Screen name="SymbolNews" component={SymbolNewsScreen} />
      <Stack.Screen name="SymbolChat" component={SymbolChatScreen} />
    </Stack.Navigator>
  );
}
