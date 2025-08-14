// screens/SymbolDetailScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import ProCandleChart from '../components/ProCandleChart';
import { AV_BASE, AV_API_KEY } from '../lib/config';

// ───────────────────────────────────────────────────────────────────────────────
// helper (put near top of SymbolDetailScreen.tsx)
type AvMap = Record<string, { [k: string]: string }>;
export type Candle = { t: number; o: number; h: number; l: number; c: number; v?: number };

function avToOHLC(m: AvMap | undefined | null): Candle[] {
  if (!m) return [];
  const rows = Object.entries(m)
    .map(([ts, v]) => ({
      t: new Date(ts.replace(' ', 'T') + 'Z').getTime(),
      o: Number(v['1. open']),
      h: Number(v['2. high']),
      l: Number(v['3. low']),
      c: Number(v['4. close']),
      v: Number(v['5. volume'] ?? 0),
    }))
    .filter((d) => isFinite(d.o) && isFinite(d.h) && isFinite(d.l) && isFinite(d.c))
    .sort((a, b) => a.t - b.t); // ascending
  return rows;
}
// ───────────────────────────────────────────────────────────────────────────────

type RouteParams = {
  symbol: string;
  name: string;
  region?: string;
  currency?: string;
  type?: string;
};

const INTERVALS = ['1min', '5min', '15min', '30min', '60min'] as const;
type Interval = (typeof INTERVALS)[number];

export default function SymbolDetailScreen() {
  const { theme } = useTheme();
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const { symbol, name } = (params || {}) as RouteParams;

  const [interval, setInterval] = useState<Interval>('1min');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [seriesJson, setSeriesJson] = useState<any | null>(null);

  // fetch intraday series from Alpha Vantage
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const url = `${AV_BASE}?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(
          symbol,
        )}&interval=${interval}&outputsize=compact&datatype=json&apikey=${AV_API_KEY}`;

        const res = await fetch(url);
        const json = await res.json();

        if (!alive) return;

        // Handle AV throttle or errors
        if (json?.Note) throw new Error('API limit reached. Try again shortly.');
        if (json?.Information) throw new Error(json.Information);
        if (json?.ErrorMessage) throw new Error(json.ErrorMessage);

        setSeriesJson(json);
      } catch (e: any) {
        setSeriesJson(null);
        setErr(e?.message || 'Failed to load data');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [symbol, interval]);

  // map AV payload ➜ OHLC
  const ohlc = useMemo(() => {
    // adjust key based on the interval you request
    const map =
      seriesJson?.['Time Series (1min)'] ||
      seriesJson?.['Time Series (5min)'] ||
      seriesJson?.['Time Series (15min)'] ||
      seriesJson?.['Time Series (30min)'] ||
      seriesJson?.['Time Series (60min)'] ||
      null;
    return avToOHLC(map);
  }, [seriesJson]);

  const last = ohlc.length ? ohlc[ohlc.length - 1].c : undefined;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: theme.colors.background },
        header: {
          paddingTop: 8,
          paddingHorizontal: 16,
          paddingBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        titleWrap: { gap: 2 },
        title: { color: theme.colors.text, fontSize: 32, fontWeight: '800' },
        sub: { color: theme.colors.textSecondary, fontSize: 14 },
        close: { color: theme.colors.textSecondary, fontSize: 16 },
        card: {
          marginHorizontal: 16,
          marginTop: 8,
          borderRadius: 16,
          backgroundColor: theme.colors.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        },
        chartWrap: { padding: 16, paddingBottom: 10 },
        empty: {
          height: 240,
          alignItems: 'center',
          justifyContent: 'center',
        },
        row: {
          paddingHorizontal: 16,
          paddingBottom: 12,
          gap: 12,
        },
        lastRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        lastLabel: { color: theme.colors.textSecondary, fontSize: 14 },
        lastPrice: { color: theme.colors.text, fontSize: 28, fontWeight: '800' },
        pills: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
        pill: {
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        pillActive: { backgroundColor: theme.colors.primary + '22', borderColor: theme.colors.primary },
        pillText: { color: theme.colors.text, fontWeight: '700' },
        pillTextActive: { color: theme.colors.text },
        footerBtns: { flexDirection: 'row', gap: 12, marginTop: 10 },
        btn: {
          flex: 1,
          borderRadius: 14,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 14,
          alignItems: 'center',
        },
        btnText: { color: theme.colors.text, fontWeight: '700' },
      }),
    [theme],
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{symbol}</Text>
          <Text style={styles.sub}>{name}</Text>
        </View>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={styles.close}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Card / Chart */}
      <View style={styles.card}>
        <View style={styles.chartWrap}>
          {loading ? (
            <View style={styles.empty}>
              <ActivityIndicator />
            </View>
          ) : ohlc.length ? (
            <ProCandleChart data={ohlc} height={260} volumeHeight={56} pad={14} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.sub}>{err || 'No data'}</Text>
            </View>
          )}
        </View>

        {/* Price + Interval pills */}
        <View style={styles.row}>
          <View style={styles.lastRow}>
            <Text style={styles.lastLabel}>Last</Text>
            <Text style={styles.lastPrice}>{last ? `$${last.toFixed(2)}` : '—'}</Text>
          </View>

          <View style={styles.pills}>
            {INTERVALS.map((iv) => {
              const active = iv === interval;
              return (
                <TouchableOpacity
                  key={iv}
                  onPress={() => setInterval(iv)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{iv}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Optional: footer actions (wire if you already have screens) */}
      {/* 
      <View style={[styles.card, { marginTop: 12, padding: 12 }]}>
        <View style={styles.footerBtns}>
          <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('SymbolNews', { symbol, name })}>
            <Text style={styles.btnText}>News</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => nav.navigate('SymbolChat', { symbol, name })}>
            <Text style={styles.btnText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
      */}
    </SafeAreaView>
  );
}
