// lib/api/alphaVantage.ts
import Constants from 'expo-constants';

export type SearchResult = {
  symbol: string;
  name: string;
  region: string;
  currency: string;
  type: string;
};

export type OHLC = {
  t: number; // ms since epoch
  o: number;
  h: number;
  l: number;
  c: number;
  v?: number;
};

const AV_BASE = 'https://www.alphavantage.co/query';
const AV_API_KEY =
  (process.env.EXPO_PUBLIC_ALPHAVANTAGE_KEY as string) ||
  ((Constants.expoConfig?.extra as any)?.EXPO_PUBLIC_ALPHAVANTAGE_KEY as string) ||
  '';

if (!AV_API_KEY) {
  console.warn('[AlphaVantage] Missing EXPO_PUBLIC_ALPHAVANTAGE_KEY in app.json -> extra.');
}

// tiny in-memory cache to soften rate limits
const _cache = new Map<string, { t: number; data: any }>();
async function getJSON(
  params: Record<string, string>,
  ttlMs = 10_000 // default 10s
) {
  const qs = new URLSearchParams({ ...params, apikey: AV_API_KEY }).toString();
  const url = `${AV_BASE}?${qs}`;
  const now = Date.now();
  const hit = _cache.get(url);
  if (hit && now - hit.t < ttlMs) return hit.data;

  const res = await fetch(url);
  const json = await res.json();

  // Alpha Vantage returns usage messages inside JSON
  if (json?.Note) {
    throw new Error(json.Note);
  }
  if (json?.Information) {
    throw new Error(json.Information);
  }
  _cache.set(url, { t: now, data: json });
  return json;
}

/** -------- Symbol search ---------- */
export async function searchSymbols(q: string): Promise<SearchResult[]> {
  if (!q.trim()) return [];
  const json = await getJSON(
    { function: 'SYMBOL_SEARCH', keywords: q.trim() },
    30_000
  );
  const matches: any[] = json?.bestMatches || [];
  return matches.map((m) => ({
    symbol: m['1. symbol'],
    name: m['2. name'],
    type: m['3. type'],
    region: m['4. region'],
    currency: m['8. currency'] || '',
  }));
}

/** -------- Intraday OHLC (1/5/15/30/60min) ---------- */
export type IntradayInterval = '1min' | '5min' | '15min' | '30min' | '60min';

export async function intraday(
  symbol: string,
  interval: IntradayInterval = '5min'
): Promise<OHLC[]> {
  const json = await getJSON(
    {
      function: 'TIME_SERIES_INTRADAY',
      symbol,
      interval,
      outputsize: 'compact',
    },
    12_000
  );

  // find the time series key e.g. "Time Series (5min)"
  const key = Object.keys(json).find((k) => k.startsWith('Time Series'));
  const series = (key ? json[key] : {}) as Record<string, any>;

  const rows: OHLC[] = Object.entries(series).map(([ts, bar]) => ({
    t: new Date(ts).getTime(),
    o: parseFloat(bar['1. open']),
    h: parseFloat(bar['2. high']),
    l: parseFloat(bar['3. low']),
    c: parseFloat(bar['4. close']),
    v: bar['5. volume'] != null ? Number(bar['5. volume']) : undefined,
  }));

  // API returns newest first; sort ascending
  rows.sort((a, b) => a.t - b.t);
  return rows;
}

/** -------- Daily OHLC (adjusted) ---------- */
export async function dailySeries(
  symbol: string,
  outputsize: 'compact' | 'full' = 'compact'
): Promise<OHLC[]> {
  const json = await getJSON(
    {
      function: 'TIME_SERIES_DAILY_ADJUSTED',
      symbol,
      outputsize,
    },
    60_000
  );
  const key = 'Time Series (Daily)';
  const series = (json[key] || {}) as Record<string, any>;

  const rows: OHLC[] = Object.entries(series).map(([ts, bar]) => ({
    t: new Date(ts).getTime(),
    o: parseFloat(bar['1. open']),
    h: parseFloat(bar['2. high']),
    l: parseFloat(bar['3. low']),
    c: parseFloat(bar['4. close']),
    v: bar['6. volume'] != null ? Number(bar['6. volume']) : undefined,
  }));
  rows.sort((a, b) => a.t - b.t);
  return rows;
}

/** -------- Latest quote ---------- */
export async function latestQuote(symbol: string): Promise<{
  price: number | null;
  change: number | null;
  changePct: number | null; // 0.45 means 0.45%
  previousClose: number | null;
}> {
  const json = await getJSON({ function: 'GLOBAL_QUOTE', symbol }, 8_000);
  const q = json?.['Global Quote'] || {};
  const price = q['05. price'] != null ? parseFloat(q['05. price']) : null;
  const change = q['09. change'] != null ? parseFloat(q['09. change']) : null;

  let changePct: number | null = null;
  if (q['10. change percent']) {
    // e.g. "0.45%"
    const pctStr = String(q['10. change percent']).replace('%', '');
    const p = parseFloat(pctStr);
    if (Number.isFinite(p)) changePct = p;
  }

  const previousClose =
    q['08. previous close'] != null ? parseFloat(q['08. previous close']) : null;

  return { price, change, changePct, previousClose };
}

/** -------- News ---------- */
export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: number; // ms
  summary?: string;
};

export async function newsForSymbol(
  symbol: string,
  limit = 20
): Promise<NewsItem[]> {
  const json = await getJSON(
    { function: 'NEWS_SENTIMENT', tickers: symbol, limit: String(limit) },
    120_000
  );
  const feed: any[] = json?.feed || [];
  return feed.map((f) => ({
    id: f?.uuid || `${f?.time_published}-${f?.title}`,
    title: f?.title || '',
    url: f?.url || '',
    source: f?.source || f?.overall_sentiment_label || 'news',
    publishedAt: f?.time_published
      ? new Date(
          `${String(f.time_published).slice(0, 4)}-${String(f.time_published).slice(
            4,
            6
          )}-${String(f.time_published).slice(6, 8)}T${String(f.time_published).slice(
            8,
            10
          )}:${String(f.time_published).slice(10, 12)}:00Z`
        ).getTime()
      : Date.now(),
    summary: f?.summary || undefined,
  }));
}
