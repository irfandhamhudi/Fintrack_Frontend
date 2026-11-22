const API_URL = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/+$/, "");

type ApiEnvelope<T> = { success: boolean; message?: string; data: T };

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({ message: "Respons server tidak valid." }));
  if (!response.ok) throw new Error(payload.message ?? "Permintaan gagal.");
  return (payload as ApiEnvelope<T>).data;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });
const normalizeEntity = <T extends Record<string, unknown>>(item: T): T => ({
  ...item,
  id: item.id ?? item._id,
});
const resource = <T>(name: string) => ({
  list: async () => (await request<T[]>(`/${name}`)).map((item) => normalizeEntity(item as Record<string, unknown>) as T),
  create: async (body: unknown) => normalizeEntity(await request<T>(`/${name}`, json("POST", body)) as Record<string, unknown>) as T,
  update: async (id: string, body: unknown) => normalizeEntity(await request<T>(`/${name}/${id}`, json("PATCH", body)) as Record<string, unknown>) as T,
  remove: (id: string) => request<null>(`/${name}/${id}`, { method: "DELETE" }),
});

export const api = {
  auth: {
    me: () => request<{ user: { id: string; name: string; email: string; currency: "IDR"; timezone: string; avatarUrl?: string; createdAt?: string } }>("/auth/me"),
    updateMe: (body: { name?: string; email?: string; avatarUrl?: string }) => request<{ user: { id: string; name: string; email: string; avatarUrl?: string } }>("/auth/me", json("PATCH", body)),
    login: (email: string, password: string) => request<{ user: { id: string; name: string; email: string; avatarUrl?: string } }>("/auth/login", json("POST", { email, password })),
    register: (name: string, email: string, password: string) => request<{ user: { id: string; name: string; email: string; avatarUrl?: string } }>("/auth/register", json("POST", { name, email, password })),
    logout: () => request<null>("/auth/logout", json("POST")),
  },
  wallets: resource("wallets"),
  categories: resource("categories"),
  transactions: resource("transactions"),
  budgets: resource("budgets"),
  goals: resource("goals"),
  recurring: resource("recurring"),
  upload: (file: File, type = "wallet") => { const body = new FormData(); body.append("file", file); body.append("type", type); return request<{ url: string }>("/uploads", { method: "POST", body }); },
};
