"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { firstLine, monthLabel, type Entry } from "@/lib/types";

export function ArchiveApp() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/entries")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <p className="mt-16 text-center text-[14px] leading-7 text-soft">
        没连上网，看不到海岸线。
      </p>
    );
  }

  if (!entries) {
    return (
      <div className="mt-16 flex justify-center">
        <span className="block h-[3px] w-[3px] rounded-full bg-accent" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="mt-16 text-center text-[14px] leading-7 text-sub">
        岛上还没有留下什么。
      </p>
    );
  }

  const groups: { label: string; items: Entry[] }[] = [];
  for (const e of entries) {
    const label = monthLabel(e.entry_date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(e);
    else groups.push({ label, items: [e] });
  }

  return (
    <div className="page-in flex flex-col">
      {groups.map((g) => (
        <section key={g.label} className="mt-8 first:mt-6">
          <h2 className="font-serif text-[13px] tracking-[0.08em] text-sub">{g.label}</h2>
          <div className="mt-1">
            {g.items.map((e) => {
              const [, m, d] = e.entry_date.split("-");
              const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(
                new Date(e.entry_date + "T12:00:00")
              );
              return (
                <Link
                  key={e.id}
                  href={`/archive/${e.id}`}
                  className="flex items-baseline gap-4 border-b border-line py-4 last:border-b-0"
                >
                  <span className="shrink-0 text-[12.5px] tracking-[0.04em] text-sub">
                    {Number(m)}月{Number(d)}日 {weekday}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[15px] leading-6 text-ink">
                    {firstLine(e.body)}
                  </span>
                  {e.weather && (
                    <span className="shrink-0 text-[12px] text-sub">{e.weather}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
