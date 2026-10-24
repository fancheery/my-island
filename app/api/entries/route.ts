import { NextRequest, NextResponse } from "next/server";
import { listEntries, upsertEntry } from "@/lib/backend";
import type { Entry, Weather } from "@/lib/types";

export async function GET(): Promise<NextResponse> {
  try {
    const entries = await listEntries();
    return NextResponse.json({ ok: true, entries });
  } catch (e) {
    if ((e as { code?: string }).code === "UNAUTHENTICATED") {
      return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const id: string = String(body?.id ?? crypto.randomUUID());
    const entry_date: string = String(body?.entry_date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry_date)) {
      return NextResponse.json({ ok: false, error: "日期无效" }, { status: 400 });
    }
    const entry: Entry = {
      id,
      kind: String(body?.kind ?? "diary"),
      entry_date,
      body: String(body?.body ?? "").slice(0, 20000),
      weather: (["晴", "有雾", "下雨", "起风", "夜"].includes(body?.weather)
        ? (body.weather as Weather)
        : null) as Weather,
      image_paths: Array.isArray(body?.image_paths)
        ? body.image_paths.slice(0, 3).map(String)
        : [],
      created_at: String(body?.created_at ?? new Date().toISOString()),
      updated_at: new Date().toISOString(),
    };
    const saved = await upsertEntry(entry);
    return NextResponse.json({ ok: true, entry: saved });
  } catch (e) {
    if ((e as { code?: string }).code === "UNAUTHENTICATED") {
      return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
