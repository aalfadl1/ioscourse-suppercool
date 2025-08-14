// screens/SymbolSearchScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,                 // ← needed for the empty state
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,   // ← used while loading
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

type SymbolItem = {
  symbol: string;
  name: string;
  region?: string;
  currency?: string;
  type?: string;
};

export default function SymbolSearchScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  const [q, setQ] = useState('');
  const [results, setResults] = useState<SymbolItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Temporary local data so the screen works without network
  const catalog: SymbolItem[] = useMemo(
    () => [
      { symbol: 'AAPL', name: 'Apple Inc.', region: 'United States', currency: 'USD', type: 'Equity' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', region: 'United States', currency: 'USD', type: 'Equity' },
      { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', region: 'United States', currency: 'USD', type: 'Equity' },
      { symbol: 'TSLA', name: 'Tesla, Inc.', region: 'United States', currency: 'USD', type: 'Equity' },
      { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', region: 'Crypto', currency: 'USD', type: 'Crypto' },
      { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', region: 'Crypto', currency: 'USD', type: 'Crypto' },
      { symbol: 'EURUSD', name: 'Euro / US Dollar', region: 'Forex', currency: 'USD', type: 'Forex' },
    ],
    []
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingHorizontal: 16,
        },
        input: {
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginTop: 16,
        },
        list: { marginTop: 12 },
        item: {
          backgroundColor: theme.colors.surface,
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginBottom: 10,
        },
        sym: { color: theme.colors.text, fontWeight: '700', fontSize: 16 },
        sub: { color: theme.colors.textSecondary, marginTop: 4 },
        empty: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 48,
        },
      }),
    [theme]
  );

  const runSearch = (text: string) => {
    setQ(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    // Fake a small delay to mimic network
    setTimeout(() => {
      const t = text.toLowerCase();
      setResults(
        catalog.filter(
          (r) =>
            r.symbol.toLowerCase().includes(t) ||
            r.name.toLowerCase().includes(t)
        )
      );
      setLoading(false);
    }, 250);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.body}>
        <TextInput
          value={q}
          onChangeText={runSearch}
          placeholder="Search symbols (AAPL, BTC, EURUSD...)"
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.input}
          autoCapitalize="characters"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {loading ? (
          <ActivityIndicator />
        ) : results.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
              Type at least 2 characters to search.
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.symbol}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() =>
                  navigation.navigate('SymbolDetail', {
                    symbol: item.symbol,
                    name: item.name,
                    region: item.region,
                    currency: item.currency,
                    type: item.type,
                  })
                }
              >
                <Text style={styles.sym}>{item.symbol}</Text>
                <Text style={styles.sub}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
