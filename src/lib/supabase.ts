import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Publishable anon key — safe for the browser (RLS enforces access).
const SUPABASE_URL = "https://mjlnyvoulsvwlumfovjj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qbG55dm91bHN2d2x1bWZvdmpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NzQ3OTQsImV4cCI6MjA5ODU1MDc5NH0.xhdkzYBQBkXjwgDCgNdUXwzqJZsH-EDb3WonuYtHJhc";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "elitex-auth",
  },
});

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
