import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mode: "dev" });
  }
  let email = "";
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "无效的请求" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "邮箱格式不对" }, { status: 400 });
  }
  const origin = new URL(req.url).origin;
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, mode: "supabase" });
}
