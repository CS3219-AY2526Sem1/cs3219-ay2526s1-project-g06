import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { fbAuth } from "../lib/firebase";
import { Link } from "react-router-dom";

export default function Login() {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [err,setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const cred = await signInWithEmailAndPassword(fbAuth, email, password);

      // exchange Firebase ID token for a server session cookie
      const idToken = await cred.user.getIdToken(/* forceRefresh? */ true);
      await fetch(`${import.meta.env.VITE_API_BASE}/auth/session`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      // redirect to your app page
      location.href = "/app";
    } catch (e:any) {
      setErr(e.message ?? "Login failed");
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "5rem auto", padding: 24 }}>
      <h1>PeerPrep</h1>
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
  
        <br />
        <br />
  
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
  
        <br />
        <br />
  
        <button type="submit">Log in</button>
      </form>
  
      {/* NEW: link to the Register page */}
      <p style={{ marginTop: 12 }}>
        Don’t have an account? <Link to="/register">Create one</Link>
      </p>
    </main>
  );
}
