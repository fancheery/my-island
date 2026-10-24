import { NextResponse } from "next/server";
import JSZip from "jszip";
import { listEntries, resolveImageUrl } from "@/lib/backend";
import { isSupabaseConfigured } from "@/lib/supabase-server";

export async function GET(): Promise<NextResponse> {
  try {
    const entries = await listEntries();
    const zip = new JSZip();

    let md = "# 我的岛 · 导出\n\n";
    for (const e of entries) {
      const weather = e.weather ? ` · ${e.weather}` : "";
      md += `## ${e.entry_date}${weather}\n\n`;
      md += e.body ? `${e.body}\n\n` : "（没写字）\n\n";
      e.image_paths.forEach((p, i) => {
        const name = `images/${e.entry_date}-${e.id.slice(0, 8)}-${i + 1}.jpg`;
        md += `![照片 ${i + 1}](${name})\n`;
      });
      md += "\n---\n\n";
    }
    zip.file("日记.md", md);
    zip.file("日记.json", JSON.stringify(entries, null, 2));

    // 图片（演示模式的 data: URL 与云端的签名地址都解析成字节）
    for (const e of entries) {
      for (let i = 0; i < e.image_paths.length; i++) {
        const p = e.image_paths[i];
        const name = `images/${e.entry_date}-${e.id.slice(0, 8)}-${i + 1}.jpg`;
        try {
          let buf: Buffer | null = null;
          if (p.startsWith("data:image/")) {
            const b64 = p.split(",")[1];
            if (b64) buf = Buffer.from(b64, "base64");
          } else if (isSupabaseConfigured()) {
            const url = await resolveImageUrl(p);
            if (url) {
              const res = await fetch(url, { cache: "no-store" });
              if (res.ok) buf = Buffer.from(await res.arrayBuffer());
            }
          }
          if (buf && buf.length > 0) {
            zip.file(name, buf);
          }
        } catch {
          // 单张失败不影响整体导出
        }
      }
    }

    const data = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="myisland-${ymd}.zip"; filename*=UTF-8''${encodeURIComponent(`我的岛-${ymd}.zip`)}`,
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "UNAUTHENTICATED") {
      return NextResponse.json({ ok: false, error: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
