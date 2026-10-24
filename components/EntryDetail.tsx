"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WEATHERS, type Entry, type Weather } from "@/lib/types";

export function EntryDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState("");
  const [weather, setWeather] = useState<Weather>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/entries/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.entry) {
          setEntry(d.entry);
          setBody(d.entry.body);
          setWeather(d.entry.weather);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [params.id]);

  async function save() {
    if (!entry) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, weather }),
      });
      const d = await res.json();
      if (d.ok) {
        setEntry(d.entry);
        setEditing(false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!entry) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 4000);
      return;
    }
    setBusy(true);
    await fetch(`/api/entries/${entry.id}`, { method: "DELETE" });
    router.replace("/archive");
  }

  if (notFound) {
    return (
      <div className="mt-16 text-center">
        <p className="text-[14px] leading-7 text-sub">没有这一页。</p>
        <Link href="/archive" className="mt-6 inline-block text-[13px] text-accent">
          回到海岸线
        </Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="mt-16 flex justify-center">
        <span className="block h-[3px] w-[3px] rounded-full bg-accent" />
      </div>
    );
  }

  const dateLine = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(entry.entry_date + "T12:00:00"));

  const updated = new Date(entry.updated_at);
  const updatedLine = `${updated.getFullYear()}年${updated.getMonth() + 1}月${updated.getDate()}日 改`;

  return (
    <div className="page-in">
      <div className="flex items-baseline justify-between pt-6">
        <Link href="/archive" className="text-[14px] tracking-[0.04em] text-sub">
          ← 回看
        </Link>
        <span className="text-[12.5px] tracking-[0.06em] text-sub">
          {entry.weather ? `${entry.weather} · ` : ""}
          {dateLine}
        </span>
      </div>

      {editing ? (
        <div className="mt-7">
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="h-[40vh] w-full resize-none bg-transparent text-[17px] leading-[1.92] tracking-[0.01em] text-ink"
          />
          <div className="mt-2 flex gap-5 text-[13px] text-sub">
            {WEATHERS.map((w) => (
              <button
                key={w.key}
                onClick={() => setWeather(weather === w.key ? null : w.key)}
                className={weather === w.key ? "text-ink" : ""}
              >
                {w.label}
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-6">
            <button onClick={save} disabled={busy} className="text-[14px] text-accent">
              {busy ? "收好中…" : "收好"}
            </button>
            <button onClick={() => { setBody(entry.body); setWeather(entry.weather); setEditing(false); }} className="text-[14px] text-sub">
              不改了
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-7">
          {entry.body ? (
            <p className="whitespace-pre-wrap text-[17px] leading-[1.92] tracking-[0.01em] text-ink">
              {entry.body}
            </p>
          ) : (
            <p className="text-[15px] text-sub">（没写字）</p>
          )}

          {entry.image_paths.length > 0 && (
            <div className="mt-5 space-y-3">
              {entry.image_paths.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`/api/image?path=${encodeURIComponent(p)}`}
                  alt=""
                  className="w-full rounded-[10px] object-cover"
                />
              ))}
            </div>
          )}

          <p className="mt-8 text-[12px] tracking-[0.04em] text-sub/80">{updatedLine}</p>

          <div className="mt-6 flex items-center gap-6 border-t border-line pt-5 text-[13px]">
            <button onClick={() => setEditing(true)} className="text-accent">
              修改
            </button>
            <button onClick={remove} disabled={busy} className={confirmingDelete ? "text-soft" : "text-sub"}>
              {confirmingDelete ? "真的要删吗？删掉就没了" : "删除"}
            </button>
            {confirmingDelete && (
              <button onClick={() => setConfirmingDelete(false)} className="text-accent">
                留着
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
