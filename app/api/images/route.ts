import { NextRequest, NextResponse } from "next/server";
import { saveImage } from "@/lib/backend";

const MAX_SIZE = 4 * 1024 * 1024; // data: URL 约 4MB，对应压缩后 ~3MB 图片

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const dataUrl: string = String(body?.dataUrl ?? "");
    const entryId: string = String(body?.entryId ?? "");
    if (!dataUrl.startsWith("data:image/") || dataUrl.length > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: "图片无效" }, { status: 400 });
    }
    if (!entryId) {
      return NextResponse.json({ ok: false, error: "缺少 entryId" }, { status: 400 });
    }
    const path = await saveImage(entryId, dataUrl);
    return NextResponse.json({ ok: true, path });
  } catch (e) {
    if ((e as { code?: string }).code === "UNAUTHENTICATED") {
      return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
