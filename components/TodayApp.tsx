"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDateLine, greeting, todayStr, WEATHERS, type Entry, type Weather } from "@/lib/types";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "offline";

const MAX_PHOTOS = 3;
const MAX_DIM = 1600;

function weatherGlyph(w: Weather) {
  switch (w) {
    case "晴":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.6v2.1M12 19.3v2.1M2.6 12h2.1M19.3 12h2.1M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5" />
        </svg>
      );
    case "有雾":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M3 8h13M6 12h13M9 16h9" />
        </svg>
      );
    case "下雨":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M7 14a4.5 4.5 0 0 1 .6-8.9A5.5 5.5 0 0 1 18 7.7 4 4 0 0 1 17.5 14" />
          <path d="M9 17l-1 2.4M13 17l-1 2.4M17 17l-1 2.4" />
        </svg>
      );
    case "起风":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M4 8h9a2.5 2.5 0 1 0-2.4-3.2M4 12h13a2.5 2.5 0 1 1-2.4 3.2M4 16h6" />
        </svg>
      );
    case "夜":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5 8 8 0 1 0 19.5 14.5Z" />
        </svg>
      );
    default:
      return null;
  }
}

/** 压缩并去掉 EXIF（重新编码天然抹掉元数据） */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load"));
    };
    img.src = url;
  });
}

export function TodayApp() {
  const today = todayStr();
  const [entry, setEntry] = useState<{ id: string | null; body: string; weather: Weather; image_paths: string[] }>({
    id: null,
    body: "",
    weather: null,
    image_paths: [],
  });
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [uploading, setUploading] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryRef = useRef(entry);
  entryRef.current = entry;
  const createdThisSession = useRef(false);
  const loadedRef = useRef(false);

  const draftKey = `myisland.draft.${today}`;

  // ---------- 保存 ----------
  const doSave = useCallback(async () => {
    const e = entryRef.current;
    if (!loadedRef.current) return;
    // 本次会话新建、且仍然是空的 → 不落库
    if (createdThisSession.current && e.body.trim() === "" && e.image_paths.length === 0 && !e.weather && !e.id) {
      return;
    }
    setSaveState("saving");
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: e.id,
          entry_date: today,
          body: e.body,
          weather: e.weather,
          image_paths: e.image_paths,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      if (data.ok && data.entry?.id) {
        if (!e.id) createdThisSession.current = true;
        entryRef.current = { ...entryRef.current, id: data.entry.id };
        setEntry((prev) => ({ ...prev, id: data.entry.id }));
        localStorage.removeItem(draftKey);
        setSaveState("saved");
        setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1600);
      }
    } catch {
      setSaveState("offline");
    }
  }, [draftKey, today]);

  const scheduleSave = useCallback(() => {
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(doSave, 800);
  }, [doSave]);

  // ---------- 加载 ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/entries");
        const data = await res.json();
        if (cancelled) return;
        const found: Entry | undefined = data.entries?.find(
          (e: Entry) => e.entry_date === today
        );
        if (found) {
          setEntry({
            id: found.id,
            body: found.body,
            weather: found.weather,
            image_paths: found.image_paths,
          });
        } else {
          const draftRaw = localStorage.getItem(draftKey);
          if (draftRaw) {
            try {
              const draft = JSON.parse(draftRaw);
              setEntry({
                id: null,
                body: draft.body ?? "",
                weather: draft.weather ?? null,
                image_paths: draft.image_paths ?? [],
              });
            } catch {
              // 忽略坏草稿
            }
          }
        }
      } catch {
        // 服务器不可用：本地草稿兜底
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          try {
            const draft = JSON.parse(draftRaw);
            setEntry({
              id: null,
              body: draft.body ?? "",
              weather: draft.weather ?? null,
              image_paths: draft.image_paths ?? [],
            });
          } catch {
            // 忽略
          }
        }
        setSaveState("offline");
      }
      setLoaded(true);
      loadedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 断网重试
  useEffect(() => {
    const onOnline = () => {
      if (saveState === "offline" || localStorage.getItem(draftKey)) {
        doSave();
      }
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [saveState, doSave, draftKey]);

  // ---------- 变更 ----------
  function update(next: Partial<typeof entry>) {
    const merged = { ...entryRef.current, ...next };
    entryRef.current = merged;
    setEntry(merged);
    localStorage.setItem(
      draftKey,
      JSON.stringify({ body: merged.body, weather: merged.weather, image_paths: merged.image_paths })
    );
    scheduleSave();
  }

  async function onPickPhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_PHOTOS - entryRef.current.image_paths.length;
    if (room <= 0) return;
    const list = Array.from(files).slice(0, room);
    setUploading(true);
    for (const f of list) {
      try {
        const dataUrl = await compressImage(f);
        const res = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId: entryRef.current.id ?? "pending", dataUrl }),
        });
        const data = await res.json();
        if (data.ok && data.path) {
          const paths = [...entryRef.current.image_paths, data.path].slice(0, MAX_PHOTOS);
          const merged = { ...entryRef.current, image_paths: paths };
          entryRef.current = merged;
          setEntry(merged);
          localStorage.setItem(
            draftKey,
            JSON.stringify({ body: merged.body, weather: merged.weather, image_paths: merged.image_paths })
          );
          scheduleSave();
        }
      } catch {
        // 单张失败跳过
      }
    }
    setUploading(false);
  }

  function removePhoto(i: number) {
    update({ image_paths: entryRef.current.image_paths.filter((_, idx) => idx !== i) });
  }

  const hour = new Date().getHours();
  const statusText = {
    idle: "",
    dirty: "",
    saving: "保存中…",
    saved: "已收好",
    offline: "没连上网，先留在这里",
  }[saveState];

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-6">
      <div className="page-in flex flex-1 flex-col">
        <div className="flex items-center justify-between pt-6">
          <span className="text-[12.5px] tracking-[0.07em] text-sub">{formatDateLine(new Date())}</span>
          <a href="/settings" aria-label="设置" className="flex h-6 w-6 items-center justify-center text-[18px] leading-none text-sub">
            ·
          </a>
        </div>

        <h1 className="mt-7 font-serif text-[26px] leading-[1.6] tracking-[0.02em] text-ink">
          {greeting(hour)}
        </h1>

        <div className="mt-6 flex-1">
          {loaded ? (
            <textarea
              value={entry.body}
              onChange={(e) => update({ body: e.target.value })}
              placeholder="写点什么，或者什么都不写。"
              className="h-full min-h-[180px] w-full resize-none bg-transparent text-[17px] leading-[1.92] tracking-[0.01em] text-ink placeholder:text-sub/50"
            />
          ) : (
            <span className="text-[17px] text-sub/50">写点什么，或者什么都不写。</span>
          )}

          {entry.image_paths.length > 0 && (
            <div className="mt-4 flex gap-3">
              {entry.image_paths.map((p, i) => (
                <button
                  key={i}
                  onClick={() => removePhoto(i)}
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px]"
                  aria-label="移除照片"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/image?path=${encodeURIComponent(p)}`}
                    alt=""
                    className="h-full w-full object-cover opacity-90"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-[13px] text-white opacity-0 transition-opacity hover:bg-ink/30 hover:opacity-100">
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-[22px] py-3.5 text-[12.5px] tracking-[0.03em] text-sub">
          {WEATHERS.map((w) => (
            <button
              key={w.key}
              onClick={() => update({ weather: entry.weather === w.key ? null : w.key })}
              className={`inline-flex items-center gap-1.5 transition-opacity ${
                entry.weather === w.key ? "text-ink" : "opacity-75 hover:opacity-100"
              }`}
              aria-pressed={entry.weather === w.key}
              aria-label={w.label}
            >
              {weatherGlyph(w.key)}
              {w.label}
            </button>
          ))}
          <label className="inline-flex cursor-pointer items-center gap-1.5 opacity-75 hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4.5" width="18" height="15" rx="3" />
              <path d="M3.5 16l4.6-4.4 3.2 2.9 3.4-3.3 5.8 5.3" />
              <circle cx="8.2" cy="9.2" r="1.3" />
            </svg>
            照片
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                onPickPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          <span className={`ml-auto text-[12px] ${saveState === "saved" ? "fade-soft text-sub" : saveState === "offline" ? "text-soft" : "text-sub"}`}>
            {uploading ? "照片在路上…" : statusText}
          </span>
        </div>
      </div>
    </main>
  );
}
