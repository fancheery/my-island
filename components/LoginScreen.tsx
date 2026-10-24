"use client";

import { useState } from "react";

export function LoginScreen({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setState("sent");
      } else {
        setState("error");
        setError(data.error ?? "没有寄出去，稍后再试。");
      }
    } catch {
      setState("error");
      setError("没连上网。");
    }
  }

  return (
    <div className="page-in flex flex-1 flex-col items-center justify-center px-8">
      <div className="w-full max-w-[320px]">
        <p className="font-serif text-[22px] tracking-[0.08em] text-ink">我的岛</p>
        <p className="mt-3 text-[13px] leading-7 text-sub">
          一个只属于你的岛。钥匙会寄到你的邮箱。
        </p>

        {state === "sent" ? (
          <p className="mt-10 text-[15px] leading-8 text-ink">
            去邮箱查收。
            <br />
            <span className="text-sub">链接 24 小时内有效。</span>
          </p>
        ) : (
          <form onSubmit={submit} className="mt-10">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="你的邮箱"
              className="w-full border-b border-line bg-transparent pb-3 text-[17px] text-ink placeholder:text-sub/60"
            />
            {error && <p className="mt-4 text-[13px] text-soft">{error}</p>}
            <button
              type="submit"
              className="mt-8 text-[14px] tracking-[0.06em] text-accent"
            >
              {state === "sending" ? "寄出中…" : "把钥匙寄到邮箱"}
            </button>
          </form>
        )}

        <p className="mt-16 text-[12px] leading-6 text-sub/80">
          登录即表示你同意：这里写下的内容只属于你，不发推、不分享。
        </p>
      </div>
    </div>
  );
}
