import { createClient } from "@supabase/supabase-js";

// For use outside a request context (e.g. a background scheduler), where
// the cookie-based server client from ./server.ts can't work since it
// depends on next/headers' cookies(), which requires an active request.
export function createBackgroundClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
