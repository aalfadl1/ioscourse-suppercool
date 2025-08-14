// screens/WatchlistScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { listWatchlist, WatchlistRow } from '../lib/db/watchlist';
import { useNavigation } from '@react-navigation/native';

export default function WatchlistScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation<any>();

  const [rows, setRows] = useState<WatchlistRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listWatchlist();
      setRows(data);
    } catch (e) {
      console.warn('watchlist load error', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }: { item: WatchlistRow }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        // Navigate into the Search tab's stack:
        navigation.navigate('Search', {
          screen: 'SymbolDetail',
          params: { symbol: item.symbol, name: item.name ?? '' },
        })
      }
    >
      <Text style={styles.symbol}>{item.symbol}</Text>
      {!!item.name && <Text style={styles.name}>{item.name}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        contentContainerStyle={rows.length ? styles.listContent : styles.emptyWrap}
        ListEmptyComponent={
          <View style={styles.emptyPill}>
            <Text style={styles.emptyText}>Your watchlist is empty. Add from a symbol page.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl tintColor={theme.colors.primary} refreshing={loading} onRefresh={load} />
        }
      />
    </View>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    listContent: { padding: 16, gap: 12 },
    emptyWrap: { padding: 16, flexGrow: 1, justifyContent: 'flex-start' },
    emptyPill: {
      backgroundColor: theme.colors.surface,
      padding: 14,
      borderRadius: 12,
    },
    emptyText: { color: theme.colors.textSecondary },
    card: {
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    symbol: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
    name: { color: theme.colors.textSecondary, marginTop: 4, fontSize: 14 },
  });
}
