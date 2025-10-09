const BASE = import.meta.env.VITE_API_BASE as string;

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export async function createSession(firebaseToken: string) {
  const res = await fetch(`${BASE}/auth/session`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${firebaseToken}`
    },
    credentials: "include"
  });
  return json<{ user: { sub: string; email: string } }>(res);
}

export async function register(body: { email: string; password: string }) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return json<{ user: { id: string; email: string } }>(res);
}

export async function login(body: { email: string; password: string }) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return json<{ user: { id: string; email: string } }>(res);
}

export async function me() {
  const res = await fetch(`${BASE}/auth/me`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await json<{ user: { uid: string; email: string } }>(res);
  return { user: { sub: data.user.uid, email: data.user.email } }; // Wrap in user object to match AuthContext
}

export async function logout() {
  await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include" });
}