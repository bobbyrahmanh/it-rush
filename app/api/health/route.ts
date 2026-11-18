import { NextResponse } from "next/server";
import { fetchSupabaseLeaderboard, isSupabaseConfigured } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return NextResponse.json({
      ok: true,
      mode: "local-hybrid-fallback",
      supabaseConfigured: false,
      checkedAt: new Date().toISOString(),
    });
  }

  const rows = await fetchSupabaseLeaderboard(1);
  return NextResponse.json({
    ok: true,
    mode: rows !== null ? "supabase-cloud" : "local-hybrid-fallback",
    supabaseConfigured: true,
    databaseReachable: rows !== null,
    checkedAt: new Date().toISOString(),
  });
}
