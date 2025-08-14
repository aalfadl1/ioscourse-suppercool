import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://yrkdpfznfdecdghjoikd.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlya2RwZnpuZmRlY2RnaGpvaWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3OTE0NDUsImV4cCI6MjA3MDM2NzQ0NX0.mT-10N7BoK6lZ3Woh4gIrUs1TVT7iMrCnNviL_TjxJY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
