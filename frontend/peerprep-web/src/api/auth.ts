export async function login(body: { email: string; password: string }) {
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Login failed (${res.status})`);
    }
    return res.json(); // { user, ... }
  }