import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

let supabase: SupabaseClient;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
} else {
  console.warn("Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  const notConfiguredError = new Error("Supabase not configured");
  const noopSubscription = { unsubscribe: () => {} };
  const authStub = {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: noopSubscription } }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: notConfiguredError }),
    signInWithOAuth: () => Promise.resolve({ data: { url: null, provider: null }, error: notConfiguredError }),
    signInWithOtp: () => Promise.resolve({ data: { user: null, session: null }, error: notConfiguredError }),
    signOut: () => Promise.resolve({ error: null }),
    updateUser: () => Promise.resolve({ data: { user: null }, error: notConfiguredError }),
    resetPasswordForEmail: () => Promise.resolve({ data: {}, error: notConfiguredError }),
  };
  supabase = { auth: authStub } as unknown as SupabaseClient;
}

export { supabase };
