import { NextResponse } from "next/server";
import { createSupabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";

export async function GET(req: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=1", req.url));
  }
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=1", req.url));
  }
  return NextResponse.redirect(new URL("/", req.url));
}
