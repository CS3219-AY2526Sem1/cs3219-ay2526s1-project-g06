import { useState } from "react";
import { login } from "../api/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await login({ email, password });
      setMsg(`Welcome ${res.user.email}`);
    } catch (e:any) {
      setMsg(e.message);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "5rem auto", border: "1px solid #ddd", padding: 24, borderRadius: 8 }}>
      <h1>PeerPrep</h1>
      {msg && <p>{msg}</p>}
      <form onSubmit={onSubmit}>
        <label>Email<br/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><br/><br/>
        <label>Password<br/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><br/><br/>
        <button type="submit">Log in</button>
      </form>
    </main>
  );
}