import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Client-side Supabase instance for interactive features.
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase env vars");
  }

  return createBrowserClient<Database>(url, anonKey);
}
