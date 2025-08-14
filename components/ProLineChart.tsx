// components/ProLineChart.tsx
import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Line,
  Circle,
  Text as SvgText,
  G,
} from 'react-native-svg';

type Candle = { t: number; close: number };

type Props = {
  data: Candle[];            // sorted by time ascending
  height?: number;          // chart height (defaults 220)
  padding?: number;         // inner padding for drawing (defaults 16)
  color?: string;           // line color
  gradientFrom?: string;    // fill top
  gradientTo?: string;      // fill bottom (transparent recommended)
  showCrosshair?: boolean;  // default true
  onPointChange?: (p: { t: number; close: number } | null) => void;
};

export default function ProLineChart({
  data,
  height = 220,
  padding = 16,
  color = '#4f46e5',
  gradientFrom = 'rgba(79,70,229,0.25)',
  gradientTo = 'rgba(79,70,229,0.02)',
  showCrosshair = true,
  onPointChange,
}: Props) {
  const [width, setWidth] = useState(0);
  const [cursor, setCursor] = useState<{ i: number; x: number; y: number } | null>(null);
  const layoutRef = useRef({ w: 0, h: height });

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    layoutRef.current = { w, h: height };
    setWidth(w);
  };

  const dims = { w: width, h: height, pad: padding };

  const scales = useMemo(() => {
    if (!data?.length || !width) return null;

    const xs = data.map(d => d.t);
    const ys = data.map(d => d.close);

    const minX = xs[0];
    const maxX = xs[xs.length - 1];

    // add 5% headroom for nicer look
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const range = maxY - minY || 1;
    const yMin = minY - range * 0.05;
    const yMax = maxY + range * 0.05;

    const xScale = (t: number) => {
      if (maxX === minX) return dims.pad;
      const pct = (t - minX) / (maxX - minX);
      return dims.pad + pct * (dims.w - dims.pad * 2);
    };

    const yScale = (v: number) => {
      const pct = (v - yMin) / (yMax - yMin);
      return dims.h - dims.pad - pct * (dims.h - dims.pad * 2);
    };

    const points = data.map(d => ({ x: xScale(d.t), y: yScale(d.close) }));

    return { xScale, yScale, points, yMin, yMax };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, height, padding]);

  const paths = useMemo(() => {
    if (!scales) return { line: '', area: '' };
    const { points } = scales;
    if (points.length < 2) return { line: '', area: '' };

    // Smooth cubic path (Catmull-Rom-ish)
    const d = (pts: { x: number; y: number }[]) => {
      const smoothing = 0.18;
      const line = pts.reduce((acc, p, i, a) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = a[i - 1];
        const next = a[i + 1] || p;
        const prev2 = a[i - 2] || prev;

        // control points
        const dx1 = p.x - prev2.x;
        const dy1 = p.y - prev2.y;
        const dx2 = next.x - prev.x;
        const dy2 = next.y - prev.y;

        const c1x = prev.x + dx1 * smoothing;
        const c1y = prev.y + dy1 * smoothing;
        const c2x = p.x - dx2 * smoothing;
        const c2y = p.y - dy2 * smoothing;

        return `${acc} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p.x} ${p.y}`;
      }, '');
      return line;
    };

    const linePath = d(scales.points);

    const first = scales.points[0];
    const last = scales.points[scales.points.length - 1];
    const bottom = dims.h - dims.pad;

    const areaPath = `${linePath} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
    return { line: linePath, area: areaPath };
  }, [scales, dims.h, dims.pad]);

  const nearestIndex = (xPx: number) => {
    if (!scales) return 0;
    const idx = scales.points.reduce((best, p, i) => {
      const delta = Math.abs(p.x - xPx);
      return delta < Math.abs(scales.points[best].x - xPx) ? i : best;
    }, 0);
    return idx;
  };

  const onTouch = (evt: any) => {
    if (!showCrosshair || !scales) return;
    const { locationX } = evt.nativeEvent;
    const i = nearestIndex(locationX);
    const pt = scales.points[i];
    setCursor({ i, x: pt.x, y: pt.y });
    onPointChange?.(data[i]);
  };

  const endTouch = () => {
    if (!showCrosshair) return;
    setCursor(null);
    onPointChange?.(null);
  };

  const bg = 'transparent';

  return (
    <View style={{ height }} onLayout={handleLayout}>
      {width > 0 && scales && paths.line ? (
        <Svg width="100%" height={height}>
          <Defs>
            <LinearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={gradientFrom} />
              <Stop offset="1" stopColor={gradientTo} />
            </LinearGradient>
          </Defs>

          {/* hit rect for gestures */}
          <Rect
            x={0}
            y={0}
            width={dims.w}
            height={dims.h}
            fill={bg}
            onTouchStart={onTouch}
            onTouchMove={onTouch}
            onTouchEnd={endTouch}
            onTouchCancel={endTouch}
          />

          {/* Area fill */}
          <Path d={paths.area} fill="url(#fillGradient)" />

          {/* Line */}
          <Path d={paths.line} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />

          {/* Crosshair + marker + tooltip */}
          {showCrosshair && cursor && (
            <G>
              <Line
                x1={cursor.x}
                y1={dims.pad}
                x2={cursor.x}
                y2={dims.h - dims.pad}
                stroke={color}
                strokeOpacity={0.35}
                strokeDasharray="3 4"
              />
              <Circle cx={cursor.x} cy={cursor.y} r={4} fill={color} />
              {/* Price pill */}
              <G x={Math.min(Math.max(cursor.x - 48, 4), dims.w - 96)} y={dims.pad + 6}>
                <Rect width={96} height={28} rx={14} ry={14} fill="#1f2937" opacity={0.95} />
                <SvgText
                  x={48}
                  y={19}
                  fill="#fff"
                  fontSize="12"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {formatPrice(data[cursor.i].close)}
                </SvgText>
              </G>
            </G>
          )}
        </Svg>
      ) : (
        <View style={styles.emptyBox}>
          <View />
        </View>
      )}
    </View>
  );
}

function formatPrice(v: number) {
  if (v >= 1000) return `$${v.toFixed(2)}`;
  if (v >= 100) return `$${v.toFixed(2)}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(4)}`;
}

const styles = StyleSheet.create({
  emptyBox: { flex: 1 },
});
