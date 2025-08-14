// lib/api/news.ts
import { AV_BASE, AV_API_KEY } from '../config';

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO
  summary?: string;
  imageUrl?: string;
};

// Uses Alpha Vantage News & Sentiment API
// Docs: function=NEWS_SENTIMENT&tickers=...&sort=LATEST
export async function fetchSymbolNews(symbol: string, limit = 20): Promise<NewsItem[]> {
  const url = `${AV_BASE}?function=NEWS_SENTIMENT&tickers=${encodeURIComponent(symbol)}&sort=LATEST&limit=${limit}&apikey=${AV_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.Note) throw new Error('News limit reached — try again shortly.');
  const feed = (json.feed || []) as any[];
  return feed.map((a) => ({
    id: a?.uuid || a?.title,
    title: a?.title || 'Untitled',
    url: a?.url,
    source: a?.source || a?.authors?.[0]?.name || 'Unknown',
    publishedAt: a?.time_published ?
      new Date(`${a.time_published.slice(0,4)}-${a.time_published.slice(4,6)}-${a.time_published.slice(6,8)}T${a.time_published.slice(9,11)}:${a.time_published.slice(11,13)}:${a.time_published.slice(13,15)}Z`).toISOString() :
      new Date().toISOString(),
    summary: a?.summary,
    imageUrl: a?.banner_image,
  }));
}