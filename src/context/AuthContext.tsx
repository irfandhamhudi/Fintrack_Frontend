import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";

type Session = { id: string; name: string; email: string; avatarUrl?: string; createdAt?: string; expiresAt: number };
type AuthContextValue = { user: Session | null; loading: boolean; login: (email: string, password: string) => Promise<string | null>; register: (name: string, email: string, password: string) => Promise<string | null>; logout: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.auth.me().then(({ user: current }) => setUser({ ...current, expiresAt: Date.now() + 7 * 86400000 })).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) { try { const { user: current } = await api.auth.login(email, password); setUser({ ...current, expiresAt: Date.now() + 7 * 86400000 }); return null; } catch (error) { return error instanceof Error ? error.message : "Login gagal."; } },
    async register(name, email, password) { try { const { user: current } = await api.auth.register(name, email, password); setUser({ ...current, expiresAt: Date.now() + 7 * 86400000 }); return null; } catch (error) { return error instanceof Error ? error.message : "Registrasi gagal."; } },
    async logout() { await api.auth.logout().catch(() => undefined); setUser(null); },
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within AuthProvider"); return context; }
