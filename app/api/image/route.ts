import { NextRequest, NextResponse } from "next/server";
import { resolveImageUrl } from "@/lib/backend";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const p = req.nextUrl.searchParams.get("path") ?? "";
  if (!p) return new NextResponse("missing path", { status: 400 });

  // 演示模式：直接返回 data: URL
  if (p.startsWith("data:image/")) {
    const [head, b64] = p.split(",");
    const mime = /data:(image\/[a-z+]+);base64/.exec(head)?.[1] ?? "image/jpeg";
    return new NextResponse(Buffer.from(b64 ?? "", "base64"), {
      headers: { "Content-Type": mime, "Cache-Control": "private, max-age=3600" },
    });
  }

  const signed = await resolveImageUrl(p);
  if (!signed) return new NextResponse("not found", { status: 404 });
  return NextResponse.redirect(signed);
}
