import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import { join } from "path";
dotenv.config({ path: join(process.cwd(), "../.env") });

const supabaseUrl = process.env.SUPABASE_URL || "https://dummy.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy";

/*
 Admin client — uses service_role key to bypass RLS.
 Used server-side only for operations that require full access.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/*
 Create a Supabase client scoped to a specific user's JWT.
 This respects RLS policies for that user.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || "dummy", {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
