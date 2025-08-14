// components/ProCandleChart.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Rect, Line, Group } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../contexts/ThemeContext';

export type OHLC = {
  t: number;     // epoch seconds OR ms
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

type Props = {
  data: OHLC[];
  height?: number;
  volumeHeight?: number;
  pad?: number;
};

export default function ProCandleChart({
  data,
  height = 280,
  volumeHeight = 56,
  pad = 14,
}: Props) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // ---- colors (safe fallbacks; no theme.colors.danger/success assumptions)
  const colBg = theme.colors.card;
  const colGrid = theme.colors.border;
  const upColor = (theme.colors as any).up || '#2ecc71';
  const downColor = (theme.colors as any).down || '#ff6b6b';
  const text = theme.colors.text;
  const textSecondary = theme.colors.textSecondary;
  const primary = theme.colors.primary;

  // ---- geometry
  const plot = useMemo(() => {
    const w = Math.max(1, width - pad * 2);
    const plotH = Math.max(1, height - volumeHeight - pad * 2);
    const n = Math.max(1, data.length);

    const per = w / n;                 // slot width per candle
    const bar = Math.max(2, Math.min(12, per * 0.66)); // body width

    // price domain
    let pMin = Infinity, pMax = -Infinity, vMax = 0;
    for (const d of data) {
      if (d == null) continue;
      pMin = Math.min(pMin, d.l);
      pMax = Math.max(pMax, d.h);
      vMax = Math.max(vMax, d.v || 0);
    }
    if (!isFinite(pMin) || !isFinite(pMax)) { pMin = 0; pMax = 1; }
    if (pMax === pMin) pMax = pMin + 1;

    const y = (p: number) =>
      pad + (plotH - ((p - pMin) / (pMax - pMin)) * plotH);

    const volY0 = pad + plotH + 6;
    const volH = volumeHeight - 12;
    const vY = (v: number) => volY0 + (1 - (v / Math.max(1, vMax))) * volH;

    return { w, plotH, per, bar, y, pMin, pMax, vY, volY0, volH, vMax };
  }, [width, height, volumeHeight, pad, data]);

  // ---- hover index from x
  const hoverIndex = useMemo(() => {
    if (hoverX == null || data.length === 0) return -1;
    const x = Math.min(width - pad, Math.max(pad, hoverX));
    const i = Math.round((x - pad) / plot.per - 0.5);
    return Math.max(0, Math.min(data.length - 1, i));
  }, [hoverX, width, pad, plot.per, data.length]);

  // ---- gesture (Pan)
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin((e) => setHoverX(e.x))
        .onChange((e) => setHoverX(e.x))
        .onFinalize(() => setHoverX(null)),
    []
  );

  // ---- derived (time/ohlc strings)
  const hover = hoverIndex >= 0 ? data[hoverIndex] : null;
  const hoverCx =
    hoverIndex >= 0 ? pad + (hoverIndex + 0.5) * plot.per : null;
  const priceY = hover ? plot.y(hover.c) : null;

  const tsStr = useMemo(() => {
    if (!hover) return '';
    // accept seconds or ms
    const ms = hover.t > 1e12 ? hover.t : hover.t * 1000;
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [hover]);

  // ---- UI
  return (
    <View
      style={{ width: '100%' }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <GestureDetector gesture={pan}>
          <View style={{ width: '100%', height }}>
            <Canvas style={{ width: '100%', height }}>
              {/* card bg */}
              <Rect x={0} y={0} width={width} height={height} color={colBg} />

              {/* grid (5 horizontals) */}
              <Group>
                {Array.from({ length: 5 }).map((_, k) => {
                  const yy = pad + (plot.plotH * (k + 1)) / 5;
                  return (
                    <Line
                      key={`g${k}`}
                      p1={{ x: pad, y: yy }}
                      p2={{ x: width - pad, y: yy }}
                      color={colGrid}
                      strokeWidth={1}
                    />
                  );
                })}
              </Group>

              {/* candles */}
              <Group>
                {data.map((d, i) => {
                  const xCenter = pad + (i + 0.5) * plot.per;
                  const openY = plot.y(d.o);
                  const closeY = plot.y(d.c);
                  const highY = plot.y(d.h);
                  const lowY = plot.y(d.l);
                  const bodyY = Math.min(openY, closeY);
                  const bodyH = Math.max(2, Math.abs(closeY - openY));
                  const up = d.c >= d.o;
                  const color = up ? upColor : downColor;

                  return (
                    <Group key={`c${i}`}>
                      {/* wick */}
                      <Line
                        p1={{ x: xCenter, y: highY }}
                        p2={{ x: xCenter, y: lowY }}
                        color={color}
                        strokeWidth={1}
                      />
                      {/* body */}
                      <Rect
                        x={xCenter - plot.bar / 2}
                        y={bodyY}
                        width={plot.bar}
                        height={bodyH}
                        color={color}
                      />
                    </Group>
                  );
                })}
              </Group>

              {/* volume */}
              <Group>
                {data.map((d, i) => {
                  const x = pad + i * plot.per + (plot.per - plot.bar) / 2;
                  const up = d.c >= d.o;
                  const color = up ? upColor : downColor;
                  const yTop = plot.vY(d.v || 0);
                  const h = plot.volY0 + plot.volH - yTop;
                  return (
                    <Rect
                      key={`v${i}`}
                      x={x}
                      y={yTop}
                      width={plot.bar}
                      height={h}
                      color={color}
                    />
                  );
                })}
              </Group>

              {/* crosshair */}
              {hover && hoverCx != null && priceY != null && (
                <Group>
                  {/* vertical */}
                  <Line
                    p1={{ x: hoverCx, y: pad }}
                    p2={{ x: hoverCx, y: pad + plot.plotH }}
                    color={primary}
                    strokeWidth={1}
                  />
                  {/* horizontal through close */}
                  <Line
                    p1={{ x: pad, y: priceY }}
                    p2={{ x: width - pad, y: priceY }}
                    color={colGrid}
                    strokeWidth={1}
                  />
                </Group>
              )}
            </Canvas>

            {/* ----- RN overlay: badges/labels ----- */}
            {hover && hoverCx != null && priceY != null && (
              <>
                {/* time + OHLC pill */}
                <View style={[styles.badge, { top: 8, alignSelf: 'center', backgroundColor: theme.colors.surface, borderColor: colGrid }]}>
                  <Text style={[styles.badgeTxt, { color: text }]}>
                    {tsStr}{'  '}
                    <Text style={styles.dim}>O</Text> {hover.o.toFixed(2)}{'  '}
                    <Text style={styles.dim}>H</Text> {hover.h.toFixed(2)}{'  '}
                    <Text style={styles.dim}>L</Text> {hover.l.toFixed(2)}{'  '}
                    <Text style={styles.dim}>C</Text>{' '}
                    <Text style={{ color: hover.c >= (data[hoverIndex - 1]?.c ?? hover.o) ? upColor : downColor }}>
                      {hover.c.toFixed(2)}
                    </Text>
                  </Text>
                </View>

                {/* price badge at right edge */}
                <View
                  style={[
                    styles.priceBadge,
                    {
                      top: Math.max(8, Math.min(height - 24, priceY - 10)),
                      right: 8,
                      backgroundColor: theme.colors.card,
                      borderColor: colGrid,
                    },
                  ]}
                >
                  <Text style={[styles.badgeTxt, { color: text }]}>
                    ${hover.c.toFixed(2)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceBadge: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  badgeTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  dim: {
    opacity: 0.6,
    fontWeight: '700',
  },
});
