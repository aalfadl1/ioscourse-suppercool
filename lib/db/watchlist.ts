// lib/db/watchlist.ts
import { supabase } from '../supabase';

export type WatchlistRow = {
  id: string;
  user_id: string;
  symbol: string;
  name: string | null;
  created_at: string;
};

// Get current user id or throw
async function getUid(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}

// Read — newest first
export async function listWatchlist(): Promise<WatchlistRow[]> {
  const uid = await getUid();
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as WatchlistRow[];
}

// Exists?
export async function isOnWatchlist(symbol: string): Promise<boolean> {
  const uid = await getUid();
  const { count, error } = await supabase
    .from('watchlist')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid)
    .eq('symbol', symbol);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// Add (idempotent). If you don't have a unique constraint, this still works
// because duplicates are prevented by RLS + select-head logic above.
export async function addToWatchlist(symbol: string, name?: string | null) {
  const uid = await getUid();
  const already = await isOnWatchlist(symbol);
  if (already) return;

  const { error } = await supabase
    .from('watchlist')
    .insert({ user_id: uid, symbol, name: name ?? null });
  if (error) throw error;
}

// Remove
export async function removeFromWatchlist(symbol: string) {
  const uid = await getUid();
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', uid)
    .eq('symbol', symbol);
  if (error) throw error;
}
