"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "今天" },
  { href: "/archive", label: "回看" },
  { href: "/chat", label: "聊聊" },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-10 bg-paper safe-bottom">
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[560px] items-start justify-around px-6 pt-3.5 pb-4">
          {TABS.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`min-w-16 text-center text-[13px] tracking-[0.06em] ${
                  active ? "text-ink" : "text-sub"
                }`}
              >
                {t.label}
                {active && (
                  <span className="mx-auto mt-1.5 block h-[3px] w-[3px] rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
