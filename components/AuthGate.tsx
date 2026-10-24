"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { MeResponse } from "@/lib/types";
import { LoginScreen } from "./LoginScreen";

interface AuthState {
  me: MeResponse | null;
  refresh: () => void;
}

const AuthContext = createContext<AuthState>({ me: null, refresh: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);

  const refresh = () => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((m: MeResponse) => setMe(m))
      .catch(() =>
        setMe({ ok: true, mode: "dev", user: { id: "dev", email: "演示模式（本机）" } })
      );
  };

  useEffect(() => {
    refresh();
  }, []);

  const needsLogin = me !== null && me.mode === "supabase" && !me.user;

  return (
    <AuthContext.Provider value={{ me, refresh }}>
      <div className="relative flex min-h-dvh flex-1 flex-col">
        {children}
        {needsLogin && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
            <LoginScreen onAuthed={refresh} />
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
}
