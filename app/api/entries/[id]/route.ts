import { NextRequest, NextResponse } from "next/server";
import { deleteEntry, getEntry, upsertEntry } from "@/lib/backend";
import type { Weather } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const entry = await getEntry(id);
    if (!entry) {
      return NextResponse.json({ ok: false, error: "没有这一页" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, entry });
  } catch (e) {
    if ((e as { code?: string }).code === "UNAUTHENTICATED") {
      return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const current = await getEntry(id);
    if (!current) {
      return NextResponse.json({ ok: false, error: "没有这一页" }, { status: 404 });
    }
    const body = await req.json();
    const next = {
      ...current,
      body: body?.body !== undefined ? String(body.body).slice(0, 20000) : current.body,
      weather: body?.weather !== undefined ? (body.weather as Weather) : current.weather,
      image_paths:
        body?.image_paths !== undefined
          ? (body.image_paths as string[]).slice(0, 3)
          : current.image_paths,
    };
    const saved = await upsertEntry(next);
    return NextResponse.json({ ok: true, entry: saved });
  } catch (e) {
    if ((e as { code?: string }).code === "UNAUTHENTICATED") {
      return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  try {
    await deleteEntry(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if ((e as { code?: string }).code === "UNAUTHENTICATED") {
      return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
