"use client";

import { useEffect, useState } from "react";
import type { MeResponse } from "@/lib/types";

type ThemePref = "system" | "light" | "dark";

function applyTheme(t: ThemePref) {
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
}

export function SettingsApp() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [theme, setTheme] = useState<ThemePref>("system");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemePref | null;
    setTheme(saved ?? "system");
    applyTheme(saved ?? "system");
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => {});
  }, []);

  function chooseTheme(t: ThemePref) {
    setTheme(t);
    if (t === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", t);
    applyTheme(t);
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.reload();
  }

  function exportAll() {
    setExporting(true);
    window.location.href = "/api/export";
    setTimeout(() => setExporting(false), 1500);
  }

  const themes: { key: ThemePref; label: string }[] = [
    { key: "system", label: "跟随系统" },
    { key: "light", label: "浅色" },
    { key: "dark", label: "深色" },
  ];

  return (
    <div className="page-in">
      {me?.mode === "dev" && (
        <p className="mt-2 text-[13px] leading-6 text-soft">
          演示模式：数据只保存在这台电脑上。配置 Supabase 后，自动切换为云端。
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-[12px] tracking-[0.1em] text-sub">账号</h2>
        <div className="mt-3 border-b border-line py-3 text-[15px] text-ink">
          {me?.user?.email ?? "…"}
        </div>
        {me?.mode === "supabase" && (
          <button onClick={signOut} className="mt-3 text-[14px] text-accent">
            退出登录
          </button>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-[12px] tracking-[0.1em] text-sub">外观</h2>
        <div className="mt-2 flex gap-6">
          {themes.map((t) => (
            <button
              key={t.key}
              onClick={() => chooseTheme(t.key)}
              className={`flex items-center gap-2 py-3 text-[14px] ${
                theme === t.key ? "text-ink" : "text-sub"
              }`}
            >
              <span
                className={`block h-[7px] w-[7px] rounded-full border ${
                  theme === t.key ? "border-accent bg-accent" : "border-line"
                }`}
              />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[12px] tracking-[0.1em] text-sub">数据</h2>
        <div className="mt-3 border-b border-line py-3">
          <button onClick={exportAll} className="text-[15px] text-ink">
            {exporting ? "打包中…" : "导出全部"}
          </button>
          <p className="mt-1 text-[12.5px] leading-6 text-sub">
            全部日记和照片，打包成一个 zip。可以带走，也可以留作备份。
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[12px] tracking-[0.1em] text-sub">关于</h2>
        <p className="mt-3 text-[13px] leading-7 text-soft">
          我的岛 v0.1
          <br />
          一个只属于你的岛。你可以来待一会儿，写点什么，也可以什么都不做。
        </p>
      </section>
    </div>
  );
}
