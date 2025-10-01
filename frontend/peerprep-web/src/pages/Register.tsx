import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { fbAuth } from "../lib/firebase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    try {
      // 1) Create Firebase user
      const cred = await createUserWithEmailAndPassword(fbAuth, email, password);

      // 2) Send verification email (optional to block here)
      await sendEmailVerification(cred.user);

      // 3) Exchange Firebase ID token for your server session cookie
      const idToken = await cred.user.getIdToken(true);
      await fetch(`${import.meta.env.VITE_API_BASE}/auth/session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      // 4) Navigate into the app
      location.href = "/app";
    } catch (e: any) {
      setErr(e?.message ?? "Registration failed");
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "5rem auto", padding: 24 }}>
      <h1>Create your PeerPrep account</h1>
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <form onSubmit={onSubmit}>
        <label>
          Email
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <br /><br />

        <label>
          Password
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <br /><br />

        <button type="submit">Create account</button>
      </form>
    </main>
  );
}
