import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using Service Role Key.
 * ⚠️  BYPASSES RLS — Only use in Server Actions ('use server') and API routes.
 * NEVER import this file from client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
