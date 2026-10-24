import type { Entry } from "./types";
import {
  createSupabaseServer,
  getServerUserId,
  isSupabaseConfigured,
} from "./supabase-server";
import * as local from "./local-db";

/**
 * 统一后端：配置了 Supabase 环境变量时走云端（RLS 按用户隔离），
 * 否则走演示模式（数据保存在服务器本地 data/db.json，单用户 "dev"）。
 */

export async function currentUserId(): Promise<string> {
  if (isSupabaseConfigured()) {
    const id = await getServerUserId();
    if (!id) return "";
  }
  return "dev";
}

export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) {
    const err = new Error("未登录") as Error & { code?: string };
    err.code = "UNAUTHENTICATED";
    throw err;
  }
  return id;
}

export async function currentUserEmail(): Promise<string> {
  if (!isSupabaseConfigured()) return "演示模式（本机）";
  const { getServerUserEmail } = await import("./supabase-server");
  return (await getServerUserEmail()) ?? "";
}

function fromRow(r: Record<string, unknown>): Entry {
  return {
    id: String(r.id),
    kind: String(r.kind ?? "diary"),
    entry_date: String(r.entry_date),
    body: String(r.body ?? ""),
    weather: (r.weather as Entry["weather"]) ?? null,
    image_paths: Array.isArray(r.image_paths)
      ? (r.image_paths as string[])
      : [],
    created_at: String(r.created_at ?? new Date().toISOString()),
    updated_at: String(r.updated_at ?? new Date().toISOString()),
  };
}

export async function listEntries(): Promise<Entry[]> {
  if (!isSupabaseConfigured()) return local.listEntries();
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .order("entry_date", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getEntry(id: string): Promise<Entry | null> {
  if (!isSupabaseConfigured()) return local.getEntry(id);
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function upsertEntry(e: Entry): Promise<Entry> {
  const userId = await requireUserId();
  const now = new Date().toISOString();
  const entry: Entry = {
    ...e,
    updated_at: now,
    created_at: e.created_at || now,
  };
  if (!isSupabaseConfigured()) return local.upsertEntry(entry);
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("entries")
    .upsert(
      {
        id: entry.id,
        user_id: userId,
        kind: entry.kind,
        entry_date: entry.entry_date,
        body: entry.body,
        weather: entry.weather,
        image_paths: entry.image_paths,
        updated_at: entry.updated_at,
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function deleteEntry(id: string): Promise<void> {
  await requireUserId();
  if (!isSupabaseConfigured()) return local.deleteEntry(id);
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** 上传一张图片，返回存储路径（演示模式返回 data: URL 本身） */
export async function saveImage(
  entryId: string,
  dataUrl: string
): Promise<string> {
  const userId = await requireUserId();
  if (!isSupabaseConfigured()) return dataUrl;
  const base64 = dataUrl.split(",")[1];
  const buf = Buffer.from(base64, "base64");
  const name = `${Date.now()}.jpg`;
  const filePath = `${userId}/${entryId}/${name}`;
  const supabase = await createSupabaseServer();
  const { error } = await supabase.storage
    .from("images")
    .upload(filePath, buf, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  return filePath;
}

/** 生成图片访问地址（演示模式直接返回 data: URL） */
export async function resolveImageUrl(p: string): Promise<string | null> {
  if (p.startsWith("data:")) return p;
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.storage
    .from("images")
    .createSignedUrl(p, 300);
  if (error || !data) return null;
  return data.signedUrl;
}
