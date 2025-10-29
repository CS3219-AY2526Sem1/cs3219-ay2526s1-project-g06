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
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ idToken: firebaseToken })  // ← Add this line
  });
  return json<{ user: { 
    sub: string; 
    email: string;
    displayName?: string;
    photoURL?: string;
    role: string;
    bio: string;
    language: string;
    profileCompleted: boolean;
  } }>(res);
}

// Update user profile
export async function updateProfile(profileData: {
  displayName?: string;
  bio?: string;
  language?: string;
}) {
  const res = await fetch(`${BASE}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include", // Send session cookie
    body: JSON.stringify(profileData)
  });
  return json<{ user: any }>(res);
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
  const data = await json<{ user: { 
    uid: string; 
    email: string;
    displayName?: string;
    photoURL?: string;
    bio?: string;
    language?: string;
    profileCompleted?: boolean;
  } }>(res);
  return { 
    sub: data.user.uid, 
    email: data.user.email,
    displayName: data.user.displayName,
    photoURL: data.user.photoURL,
    bio: data.user.bio,
    language: data.user.language,
    profileCompleted: data.user.profileCompleted
  };
}

export async function deleteAccount() {
  const res = await fetch(`${BASE}/auth/account`, {
    method: "DELETE",
    credentials: "include" // Send session cookie only
  });
  return json<{ message: string }>(res);
}

export async function logout() {
  await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include" });
}