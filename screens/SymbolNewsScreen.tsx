// screens/SymbolNewsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useRoute } from '@react-navigation/native';
import { newsForSymbol, type NewsItem } from '../lib/api/alphaVantage';

export default function SymbolNewsScreen() {
  const { theme } = useTheme();
  const route = useRoute() as any;
  const { symbol, name } = route.params ?? {};
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const data = await newsForSymbol(symbol, 25);
        if (mounted) setItems(data);
      } catch (e: any) {
        if (mounted) setErr(e?.message ?? 'Failed to load news');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [symbol]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    item: {
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    title: { color: theme.colors.text, fontWeight: '700', marginBottom: 6 },
    meta: { color: theme.colors.textSecondary, fontSize: 12 },
    empty: { textAlign: 'center', marginTop: 24, color: theme.colors.textSecondary },
  });

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : err ? (
        <View style={{ padding: 20 }}>
          <Text style={{ color: theme.colors.textSecondary, marginBottom: 12 }}>{err}</Text>
          <Text style={{ color: theme.colors.textSecondary }}>Pull to refresh.</Text>
        </View>
      ) : items.length === 0 ? (
        <Text style={styles.empty}>No news found.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => item.url && Linking.openURL(item.url)}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.source} · {new Date(item.time).toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
