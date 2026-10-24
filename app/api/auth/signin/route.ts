import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, isSupabaseConfigured } from "@/lib/supabase-server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, mode: "dev" });
  }
  let email = "";
  let password = "";
  let register = false;
  try {
    const body = await req.json();
    email = String(body?.email ?? "").trim();
    password = String(body?.password ?? "");
    register = Boolean(body?.register);
  } catch {
    return NextResponse.json({ ok: false, error: "无效的请求" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "邮箱格式不对" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ ok: false, error: "密码至少 6 位" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();

  if (register) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === "user_already_exists") {
        return NextResponse.json(
          { ok: false, error: "这个邮箱已经有岛了，直接登录" },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    // data.session 为 null 说明项目还开着“邮箱确认”，需要用户在后台关掉
    return NextResponse.json({ ok: true, needsConfirm: !data.session });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "invalid_credentials") {
      return NextResponse.json(
        { ok: false, error: "邮箱或密码不对", code },
        { status: 401 }
      );
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  if (!data.session) {
    return NextResponse.json({ ok: false, error: "登录没有成功，再试一次" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
