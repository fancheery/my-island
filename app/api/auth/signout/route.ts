import { NextResponse } from "next/server";
import { createSupabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";

export async function POST(): Promise<NextResponse> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServer();
    await supabase.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
