"use client";

import { useState } from "react";

export function LoginScreen({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [offerRegister, setOfferRegister] = useState(false);
  const [needConfirm, setNeedConfirm] = useState(false);

  async function doAuth(register: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    setOfferRegister(false);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, register }),
      });
      const data = await res.json();
      if (data.ok) {
        if (register && data.needsConfirm) {
          setNeedConfirm(true);
        } else {
          onAuthed();
        }
      } else if (res.status === 401 && !register) {
        setError(data.error ?? "邮箱或密码不对");
        setOfferRegister(true);
      } else if (res.status === 409) {
        setError(data.error ?? "这个邮箱已经有岛了");
        setOfferRegister(false);
      } else {
        setError(data.error ?? "没有成功，稍后再试。");
      }
    } catch {
      setError("没连上网。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-in flex flex-1 flex-col items-center justify-center px-8">
      <div className="w-full max-w-[320px]">
        <p className="font-serif text-[22px] tracking-[0.08em] text-ink">我的岛</p>
        <p className="mt-3 text-[13px] leading-7 text-sub">
          一个只属于你的岛。用邮箱和密码，就能回来。
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            doAuth(false);
          }}
          className="mt-10"
        >
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="你的邮箱"
            autoComplete="email"
            className="w-full border-b border-line bg-transparent pb-3 text-[17px] text-ink placeholder:text-sub/60"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少 6 位）"
            autoComplete="current-password"
            className="mt-6 w-full border-b border-line bg-transparent pb-3 text-[17px] text-ink placeholder:text-sub/60"
          />
          {error && <p className="mt-4 text-[13px] leading-6 text-soft">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="mt-8 block text-[14px] tracking-[0.06em] text-accent"
          >
            {busy ? "正在上岛…" : "上岛"}
          </button>
        </form>

        {offerRegister && (
          <button
            onClick={() => doAuth(true)}
            disabled={busy}
            className="mt-6 text-[14px] tracking-[0.06em] text-accent"
          >
            第一次来？创建我的岛
          </button>
        )}

        {needConfirm && (
          <p className="mt-6 text-[13px] leading-7 text-soft">
            账号建好了，但还需要把 Supabase 后台的 “Confirm email” 开关关掉（Authentication
            → Providers → Email）。关掉之后回到这里，直接点「上岛」。
          </p>
        )}

        <p className="mt-16 text-[12px] leading-6 text-sub/80">
          登录即表示你同意：这里写下的内容只属于你，不发推、不分享。
        </p>
      </div>
    </div>
  );
}
