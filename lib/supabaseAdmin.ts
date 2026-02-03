import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Server-side Supabase client with service role for admin operations
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase admin env vars (SUPABASE_SERVICE_ROLE_KEY)");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
