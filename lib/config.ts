// lib/config.ts
export const AV_API_KEY = '9REL8S11976LQ1AE'; // Alpha Vantage Premium (150 rpm)
export const AV_BASE = 'https://www.alphavantage.co/query';

// Helpers for callers (nice to keep in one place)
export const AV_SERIES_KEYS = [
  'Time Series (1min)',
  'Time Series (5min)',
  'Time Series (15min)',
  'Time Series (30min)',
  'Time Series (60min)',
] as const;

export type AvInterval = '1min' | '5min' | '15min' | '30min' | '60min';

export function intradayUrl(symbol: string, interval: AvInterval) {
  const params = new URLSearchParams({
    function: 'TIME_SERIES_INTRADAY',
    symbol,
    interval,
    outputsize: 'compact',
    apikey: AV_API_KEY,
  });
  return `${AV_BASE}?${params.toString()}`;
}
