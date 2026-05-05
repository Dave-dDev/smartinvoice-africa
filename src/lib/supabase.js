import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export a proxy to handle cases where Supabase is not configured
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'auth') {
          return {
            getSession: async () => ({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: async () => { throw new Error("Supabase is not configured. Please check your environment variables."); },
            signUp: async () => { throw new Error("Supabase is not configured. Please check your environment variables."); }
          };
        }
        if (prop === 'from') {
          return () => ({
            insert: async () => { throw new Error("Supabase is not configured. Please check your environment variables."); },
            select: async () => { throw new Error("Supabase is not configured. Please check your environment variables."); }
          });
        }
        return undefined;
      }
    });

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase credentials are missing. Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in environment variables.");
}
