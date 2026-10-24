import { NextResponse } from "next/server";
import { createSupabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";
import type { MeResponse } from "@/lib/types";

export async function GET(): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    const body: MeResponse = {
      ok: true,
      mode: "dev",
      user: { id: "dev", email: "演示模式（本机）" },
    };
    return NextResponse.json(body);
  }
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const body: MeResponse = {
    ok: true,
    mode: "supabase",
    user: user ? { id: user.id, email: user.email ?? "" } : null,
  };
  return NextResponse.json(body);
}
